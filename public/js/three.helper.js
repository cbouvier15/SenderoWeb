/**
  *
  * Three.Helper
  * A bunch of helper methods for animate, render and colorize pixels.
  * Authors: dernster, alarrosa14, kitab15.
  */

  var ThreeHelper = function(){

    // ###########################################################
    // Private
    // ###########################################################
    var container, stats;
    var camera, controls, scene, renderer;

    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;

    var FRAME_RATE_MS = 1000/24;
    var CLEAR_COLOR = 0x212121;
    var CLEAR_ALPHA = 1;
    var CAMERA_Z_POSITION = 300;
    var AMBIENT_COLOR = 0x404040;

    /*** Intersection ***/
    var raycaster;
    var mouse;
    var intersectionSphere;

    var interaction_server;

    var shouldSend = true;

    function onWindowResize() {

      windowHalfX = window.innerWidth / 2;
      windowHalfY = window.innerHeight / 2;

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize( window.innerWidth, window.innerHeight );
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

        // if ( intersects.length > 0 ) {
        //   interaction_server.emit('interaction', (intersects[0].point.x).toString() + ',' + (intersects[0].point.y).toString() + ',' + (intersects[0].point.z).toString());
        // }

        shouldSend = false;

        setTimeout(function(){
          shouldSend = true;
        }, FRAME_RATE_MS);
      }
    }

    function changePixelColor(object,r,g,b){

      colorRGB = (r << 16) | (g << 8) | b;
      object.traverse( function ( child ) {
        if ( child instanceof THREE.Mesh ) {
          child.material.color.set(colorRGB);
        }
      });
    }

    // ###########################################################
    // Public Methods
    // ###########################################################

    // Three environment initialization
    function initThree(interactionServerFullURL) {

      //interaction_server = io.connect(interactionServerFullURL);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setClearColor( CLEAR_COLOR, CLEAR_ALPHA);
      renderer.setPixelRatio( window.devicePixelRatio );
      renderer.setSize( window.innerWidth, window.innerHeight );

      element = renderer.domElement;
      container = document.getElementById('container');
      container.appendChild( element );

      camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
      camera.position.z = CAMERA_Z_POSITION;

      // orbits
      controls = new THREE.OrbitControls(camera, element);
      controls.noZoom = true;
      controls.noPan = true;

      controls.addEventListener('change', render);

      // scene
      scene = new THREE.Scene();

      var ambient = new THREE.AmbientLight( AMBIENT_COLOR );
      scene.add( ambient );

      var material = new THREE.MeshBasicMaterial( {transparent: true, opacity: 0.0} );
      intersectionSphere = new THREE.Mesh( new THREE.SphereGeometry( 84, 10, 10 ), material );
      intersectionSphere.position.set(0, 0, 0);
      scene.add( intersectionSphere );

      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();
      
      document.addEventListener('mousemove', onDocumentMouseMove, false );

      window.addEventListener('resize', onWindowResize, false );
    }

    // Load 3D Models and add to the scene
    function addObject(objModel, position, up, front, RGBColor, ID, objectGetter){

      var onProgress = function ( xhr ) {
        if ( xhr.lengthComputable ) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log( Math.round(percentComplete, 2) + '% downloaded' );
        }
      };

      var onError = function ( xhr ) {
      };

      var manager = new THREE.LoadingManager();

      manager.onProgress = function ( item, loaded, total ) {

        console.log( item, loaded, total );

      };

      var loader = new THREE.OBJLoader( manager );

      /////////////////////////////////////
      var obj;
      loader.load( objModel , function ( objectSrc ) {

        var object = objectSrc.clone();

        object.traverse( function ( child ) {

          if ( child instanceof THREE.Mesh ) {

            var material = new THREE.MeshBasicMaterial( { color: RGBColor, side : THREE.DoubleSide } );
            child.material = material;

          }

        } );

        front = front.normalize();
        up = up.normalize();

        var rotFront = new THREE.Matrix4();

        var qFront = new THREE.Quaternion();
        qFront.setFromUnitVectors(new THREE.Vector3(1,0,0),front);

        var newSourceUp = new THREE.Vector3(0,0,1); // hardcoded

        var qUp = new THREE.Quaternion();
        qUp.setFromUnitVectors(newSourceUp,up);

        var qTot = qFront;
        
        object.setRotationFromQuaternion(qTot);
        
        object.position.set(position.x*1.1,position.y*1.1,position.z*1.1);
        
        scene.add( object );

        object.pixelId = ID;
        objectGetter(object);
      }, onProgress, onError );

      /////////////////////////////////////////
    }

    // Update model's color based on the streaming
    function update(frame, pixels){

      var bufView = new Uint8Array(frame);
        
        for (var i = 0; i < 3*XMLParser.getPixelsQty(); i =  i + 3) {
          var R = bufView[i];
          var G = bufView[i+1];
          var B = bufView[i+2]; 

          changePixelColor(pixels[i/3], R, G, B);
        }
    }

    // ThreeJS stuffs
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
    }

    // More ThreeJS stuffs
    function render() {
      renderer.render( scene, camera );
    }

    // ###########################################################
    // Three Helper
    // ###########################################################

    var oPublic = {
      initThree: initThree,
      addObject: addObject,
      animate: animate,
      render: render,
      update: update,
    };
    return oPublic;

  }();
