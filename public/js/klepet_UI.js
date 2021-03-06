function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  var soPixe = sporocilo.indexOf('<img class="slika" src=\'') > -1;
  var jeVideo = sporocilo.indexOf('https://www.youtube.com/embed/') > -1;
  
  if (jeSmesko || soPixe || jeVideo) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace(/&lt;img class="slika"/g, '<img class="slika"').replace(/png\' \/&gt;/g, 'png\' \/\>').replace(/jpg\' \/&gt;/g, 'jpg\' \/\>').replace(/gif\' \/&gt;/g, 'gif\' \/\>').replace(/&lt;img src=\'http:\/\/sandbox\.lavbic\.net\/teaching\/OIS\/gradivo\//g, '<img src=\'http://sandbox.lavbic.net/teaching/OIS/gradivo/').replace(/&lt;iframe class="video"/g, '<iframe class="video"').replace(/allowfullscreen&gt;&lt;\/iframe&gt;/g , 'allowfullscreen></iframe>' );

  /*if (jeSmesko || jeVideo) {                                            //tukej je za sliko
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('png\' /&gt;', 'png\' />').replace(/&lt;img src=\'http:\/\/sandbox\.lavbic\.net\/teaching\/OIS\/gradivo\//g, '<img src=\'http://sandbox.lavbic.net/teaching/OIS/gradivo/').replace(/&lt;iframe class="video"/g, '<iframe class="video"').replace(/allowfullscreen&gt;&lt;\/iframe&gt;/g , 'allowfullscreen></iframe>' );                  
  */

    console.log(sporocilo);
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  var sistemskoSporocilo;
  
  sporocilo = dodajSmeske(sporocilo);
  dodajVideo(sporocilo);
  dodajSlike(sporocilo);
  
  
  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);
  +  
  socket.on('dregljaj', function(rezultat) {
    $('#vsebina').jrumble();
    $('#vsebina').trigger('startRumble');
    setTimeout(function(){
       $('#vsebina').trigger('stopRumble')
    }, 1500);
    
  });
  
  
  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);

    dodajSlike(sporocilo.besedilo);
    dodajVideo(sporocilo.besedilo);

  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
        
    $('#seznam-uporabnikov div').click(function() {
     $('#poslji-sporocilo').val('/zasebno ' +"\""+ $(this).text() +"\"");
      $('#poslji-sporocilo').focus();
    });
    
  });
  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}


function dodajSlike(vhod){
  /*return vhod.replace(/(https?):\/\/(\S+)(png|jpg|gif)/gi, function(rezultat){
    rezultat = '<img class="slika" src=\''+rezultat+'\' />';
    return rezultat;
  });*/
  
  var slike = vhod.toString().match(/\b(https?):\/\/(\S+)(png|jpg|gif)\b/gi);
  for(var i in slike){
    if(!slike[i].match(/http:\/\/sandbox\.lavbic\.net\/teaching\/OIS\/gradivo\//)){
      $('#sporocila').append(divElementHtmlTekst('<img class=\'slika\' src=\"'+ slike[i] + '\">'));
    }
  }
}


//za predstavo:
//<iframe src="demo_iframe.htm" name="iframe_a"></iframe>
//https://www.youtube.com/watch?v=2G5rfPISIwo
//{video} == 2G5rfPISIwo
//spremeni v: <iframe src="https://www.youtube.com/embed/{video}" allowfullscreen></iframe>

function dodajVideo(vhod){
  /*return vhod.replace(/\b(https?):\/\/www.youtube.com(\S+)\b/gi, function(rezultat){
    //drugace od slike
    var array = rezultat.split("=");
    rezultat = '<iframe class="video" src=\'https://www.youtube.com/embed/'+array[1]+'\' allowfullscreen></iframe>';
    console.log(rezultat);
    return rezultat;
  });*/
  var ytVideo = vhod.toString().match(/\b(https?):\/\/www.youtube.com(\S+)\b/gi);
  for(var i in ytVideo){
    var array = ytVideo[i].split("=");
    console.log(array[1]);
    $('#sporocila').append(divElementHtmlTekst('<iframe class="video" src=\'https://www.youtube.com/embed/'+array[1]+'\' allowfullscreen></iframe>'));
  }
}

