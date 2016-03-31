/**
  *
  * Interaction
  * Module to manage the interaction.
  * Authors: dernster, alarrosa14, kitab15.
  */

var Interaction = function() {
  var interaction_server;
  var shouldSend;

  /* Interaction */
  var mouse, raycaster, intersectionSphere, scene, renderer, camera;

  var touchmove;

  function init(interactionServerFullURL, fps, _scene, _renderer, _camera) {
    FRAME_PER_SECOND = fps; 
    FRAME_RATE_MS = 1000/fps;

    camera = _camera;
    renderer = _renderer;
    scene = _scene;
    var material = new THREE.MeshBasicMaterial( {transparent: true, opacity: 0.0} );
    intersectionSphere = new THREE.Mesh( new THREE.SphereGeometry( 84, 10, 10 ), material );
    intersectionSphere.position.set(0, 0, 0);
    scene.add( intersectionSphere );

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    document.addEventListener('mousemove', onDocumentMouseMove, false );
    renderer.domElement.addEventListener( 'touchmove', touchmove, false );

    interaction_server = io.connect(interactionServerFullURL);
    raycaster = new THREE.Raycaster();

    shouldSend = true;

  }

  function onDocumentMouseMove( event ) {
    event.preventDefault();
    if (shouldSend){
      mouse.x = ( event.clientX / renderer.domElement.width ) * 2 - 1;
      mouse.y = - ( event.clientY / renderer.domElement.height ) * 2 + 1;

      raycaster.setFromCamera( mouse, camera );

      var objects_intersect = [];
      objects_intersect.push(intersectionSphere);
      var intersects = raycaster.intersectObjects( objects_intersect, true );
      if ( intersects.length > 0 ) {
        interaction_server.emit('interaction', {
          name: "drag",
          data: (intersects[0].point.x).toString() + ',' + (intersects[0].point.y).toString() + ',' + (intersects[0].point.z).toString()
        });
      }

      shouldSend = false;

      setTimeout(function(){
        shouldSend = true;
      }, FRAME_RATE_MS);
    }
  }

  touchmove = function( event ) {
    var element = event.srcElement;

    switch ( event.touches.length ) {

      case 1:
        event.preventDefault();
        event.stopPropagation();

        if (shouldSend){
            console.log(event.touches[0].pageX, event.touches[0].pageY);
            console.log(event.touches[0].target.width, event.touches[0].target.height);

            mouse.x = ( window.devicePixelRatio*event.touches[0].pageX / event.touches[0].target.width ) * 2 - 1;
            mouse.y = - ( window.devicePixelRatio*event.touches[0].pageY / event.touches[0].target.height ) * 2 + 1;

            console.log(mouse.x, mouse.y);

            raycaster.setFromCamera( mouse, camera );

            var objects_intersect = [];
            objects_intersect.push(intersectionSphere);
            var intersects = raycaster.intersectObjects( objects_intersect, true );

            if ( intersects.length > 0 ) {
              interaction_server.emit('interaction', {
                name: "drag",
                data: (intersects[0].point.x).toString() + ',' + (intersects[0].point.y).toString() + ',' + (intersects[0].point.z).toString()
              });
              // console.log((intersects[0].point.x).toString() + ',' + (intersects[0].point.y).toString() + ',' + (intersects[0].point.z).toString());
            }else{
              console.log('no macho!');
            }

            shouldSend = false;

            setTimeout(function(){
              shouldSend = true;
            }, FRAME_RATE_MS);
        }

        break;
    }

  }

  return {
    init: init
  };

}();