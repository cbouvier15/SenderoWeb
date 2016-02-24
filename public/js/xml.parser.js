/**
  *
  * XMLParser
  * Module for load the play from a .XML file.
  * Author: dernster, alarrosa14, kitab15.
  */

var XMLParser = function(){

  // ###########################################################
  // Private
  // ###########################################################  

  var pixelsQty = 0;
  var meshesPath = {};
  var xmlDoc;
  var serversData = {};

  var tagToVector3 = function(tag){
    var x = parseFloat(tag.getAttribute('x'));
    var y = parseFloat(tag.getAttribute('y'));
    var z = parseFloat(tag.getAttribute('z'));
    return new THREE.Vector3(x,y,z);
  }

  // Parses Mesh tags and create a dictionary
  // with modelName: modelPath
  // Used to retrieve the model from backend
  var parseMeshesTag = function(meshesTag){
    var meshes = meshesTag[0].getElementsByTagName("Mesh");
    _.each(meshes, function(mesh){
      meshesPath[mesh.getAttribute('name')] = mesh.getAttribute('path');
    });
  };

  // Parses pixel's Id from Pixel Tag
  var parseId = function (pixel){
    return parseInt(pixel.getAttribute('id'));
  };

  // Parses pixel's color from Pixel Tag
  var parseColor = function(pixel){
    var R = parseInt(pixel.getAttribute('r'));
    var G = parseInt(pixel.getAttribute('g'));
    var B = parseInt(pixel.getAttribute('b'));

    return (R << 16) | (G << 8) | B;
  };

  // Parses pixel's model name from Pixel Tag
  var parseModelName = function(pixel){
    var renderTag = pixel.getElementsByTagName('Render')[0];
    return renderTag.getAttribute('mesh');
  };

  // Parses pixel's space position from Pixel Tag
  var parsePositionVectors = function(pixel){
    var renderTag = pixel.getElementsByTagName('Render')[0];
      
    var frontTag = renderTag.getElementsByTagName('Front')[0];
    var upTag = renderTag.getElementsByTagName('Up')[0];
    var positionTag = renderTag.getElementsByTagName('Position')[0];

    var front = tagToVector3(frontTag);
    var up = tagToVector3(upTag);
    var position = tagToVector3(positionTag);

    return {'front': front, 'up': up, 'position': position};
  };

  // ###########################################################
  // Public Methods
  // ###########################################################
  
  // Initialization
  var init = function(configurationFilePath){
    var xmlPath = configurationFilePath;

    // Get XML file 
    // code for IE7+, Firefox, Chrome, Opera, Safari
    if (window.XMLHttpRequest){
      xmlhttp=new XMLHttpRequest();
    // code for IE6, IE5
    }else{
      xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }

    xmlhttp.open("GET",xmlPath,false);
    xmlhttp.send();
    xmlDoc=xmlhttp.responseXML;

    var servers = xmlDoc.getElementsByTagName("Servers")[0].getElementsByTagName("Server");
    _.each(servers, function(server){
      serversData[server.getAttribute('name') + '_' + 'URL'] = server.getAttribute('url');
      serversData[server.getAttribute('name') + '_' + 'port'] = server.getAttribute('port');
    });
  };

  // Main method. Parses the play's XML.
  var loadPixelsFromXML = function(callBack){

    var pixelsList = [];

    // Parse Pixels
    var pixelsDoc = xmlDoc.getElementsByTagName("Pixel");
    pixelsQty = pixelsDoc.length;

    // Parse Meshes and Paths
    parseMeshesTag(xmlDoc.getElementsByTagName("Meshes"));

    var loaderFunction = function(object){
      pixelsList.push(object);
      
      // When the whole list was loaded
      // the callback is performed.
      if (pixelsList.length == pixelsQty){
        
        // order pixel objects by Id
        pixelsList = _.sortBy(pixelsList, function(o){ return o.pixelId; });
        
        callBack(pixelsList);
      }
    }

    // Parse each pixel data
    _.each(pixelsDoc, function(pixel, index){

      var ID = parseId(pixel);
      var color = parseColor(pixel);
      var objectModelName = parseModelName(pixel);
      var positionVectors = parsePositionVectors(pixel);
      var front = positionVectors['front'];
      var up = positionVectors['up'];
      var position = positionVectors['position'];

      ThreeHelper.addObject(meshesPath[objectModelName],position,up,front,color,ID,loaderFunction);
    });
  };

  // Returns the play's pixels quantity
  var getPixelsQty = function(){
    return parseInt(pixelsQty);
  };

  var getStreamingServerURL = function(){
    return serversData['StreamingServer_URL'];
  };

  var getStreamingServerPort = function(){
    return serversData['StreamingServer_port'];
  };

  var getStreamingServerFullURL = function(){
    return serversData['StreamingServer_URL'] + ':' + serversData['StreamingServer_port'];
  };

  var getInteractionServerURL = function(){
    return serversData['InteractionServer_URL'];
  };

  var getInteractionServerPort = function(){
    return serversData['InteractionServer_port'];
  }

  var getInteractionServerFullURL = function(){
    return serversData['InteractionServer_URL'] + ':' + serversData['InteractionServer_port'];
  };


  // ###########################################################
  // XML Parser
  // ###########################################################

  var oPublic = {
    init : init,
    getStreamingServerURL: getStreamingServerURL,
    getInteractionServerURL: getInteractionServerURL,
    getStreamingServerPort: getStreamingServerPort,
    getInteractionServerPort: getInteractionServerPort, 
    getStreamingServerFullURL: getStreamingServerFullURL,
    getInteractionServerFullURL: getInteractionServerFullURL,
    loadPixelsFromXML : loadPixelsFromXML,
    getPixelsQty : getPixelsQty,
  };
  return oPublic;

}();


