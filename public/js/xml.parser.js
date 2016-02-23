function tagToVector3(tag){
  var x = parseFloat(tag.getAttribute('x'));
  var y = parseFloat(tag.getAttribute('y'));
  var z = parseFloat(tag.getAttribute('z'));
	return new THREE.Vector3(x,y,z);
}

function loadPixelsFromXML(xmlPath, callBack){

  var pixelsList = [];


  if (window.XMLHttpRequest)
  {// code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp=new XMLHttpRequest();
  }
  else
  {// code for IE6, IE5
    xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
  }

  xmlhttp.open("GET",xmlPath,false);
  xmlhttp.send();
  var xmlDoc=xmlhttp.responseXML;
  
  console.log(xmlDoc);

  var pixelsDoc = xmlDoc.getElementsByTagName("Pixel")
  var pixelsQty = pixelsDoc.length

  var loaderFunction = function(object){
  	pixelsList.push(object);
  	console.log("adding pixel...");
  	if (pixelsList.length == pixelsQty){

  		console.log("calling callback");

      // order pixel objects by Id
      pixelsList = _.sortBy(pixelsList, function(o){ return o.pixelId; });

  		callBack(pixelsList);
  	}
  }

  for (var i = 0; i < pixelsDoc.length; i++) {
    
    var pixel = pixelsDoc[i]
    var ID = parseInt(pixel.getAttribute('id'))
    var R = parseInt(pixel.getAttribute('r'))
    var G = parseInt(pixel.getAttribute('g'))
    var B = parseInt(pixel.getAttribute('b'))

    var color = (R << 16) | (G << 8) | B;
    
    var renderTag = pixel.getElementsByTagName('Render')[0]

    var objectModelName = renderTag.getAttribute('mesh')
    
    var frontTag = renderTag.getElementsByTagName('Front')[0]
    var upTag = renderTag.getElementsByTagName('Up')[0]
    var positionTag = renderTag.getElementsByTagName('Position')[0]
    
    var front = tagToVector3(frontTag);
    var up = tagToVector3(upTag);
    var position = tagToVector3(positionTag);

    var print = function(vect){
      return '(' + vect.x + ',' + vect.y + ',' + vect.z + ')';
    }

    addObject(objectModelName + '100.obj',position,up,front,color,ID,loaderFunction);

  };

}