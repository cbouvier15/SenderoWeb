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
    var camera, scene, renderer, play;
    var effect, controls;
    var element, container;

    function fullscreen() {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
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

    function initThree() {

      renderer = new THREE.WebGLRenderer({antialias: true, sortObjects: false, alpha: true});
      renderer.sortObjects = false;
      renderer.setClearColor( 0x070707 , 1);
      element = renderer.domElement;
      container = document.getElementById('example');
      container.appendChild(element);

      fullscreen();

      effect = new THREE.StereoEffect(renderer);

      play = new THREE.Object3D();

      scene = new THREE.Scene();


      var debugaxis = function(axisLength){
          //Shorten the vertex function
          function v(x,y,z){
                  return new THREE.Vector3(x,y,z); 
          }
          
          //Create axis (point1, point2, colour)
          function createAxis(p1, p2, color){
                  var line, lineGeometry = new THREE.Geometry(),
                  lineMat = new THREE.LineBasicMaterial({color: color, lineWidth: 1});
                  lineGeometry.vertices.push(p1, p2);
                  line = new THREE.Line(lineGeometry, lineMat);

                  scene.add(line);
          }
          
          createAxis(v(-axisLength, 0, 0), v(axisLength, 0, 0), 0xFF0000);
          createAxis(v(0, -axisLength, 0), v(0, axisLength, 0), 0x00FF00);
          createAxis(v(0, 0, -axisLength), v(0, 0, axisLength), 0x0000FF);
      };

      scene.add(play);
      camera = new THREE.PerspectiveCamera(90, 1, 0.001, 700);
      camera.position.set(0, 0, 300);
      play.add(camera);

      controls = new THREE.OrbitControls(camera, element);
      controls.rotateUp(Math.PI / 4);
      controls.target.set(
        camera.position.x + 0.1,
        camera.position.y,
        camera.position.z
      );
      controls.noZoom = true;
      controls.noPan = true;

      function setOrientationControls(e) {
        if (!e.alpha) {
          return;
        }
        controls = new DeviceOrientationController(play, renderer.domElement);
        controls.connect();

        element.addEventListener('click', fullscreen, false);

        window.removeEventListener('deviceorientation', setOrientationControls, true);
      }
      window.addEventListener('deviceorientation', setOrientationControls, true);


      var light = new THREE.HemisphereLight(0x777777, 0x000000, 0.6);
      scene.add(light);

      var material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        specular: 0xffffff,
        shininess: 20,
        shading: THREE.FlatShading,
      });

      var geometry = new THREE.PlaneGeometry(1000, 1000);

      var mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0,-101,0);

      window.addEventListener('resize', resize, false);
      setTimeout(resize, 1);
    }

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

      manager.onLoad = function (){
        if(ID==XMLParser.getPixelsQty()-1){
          canvas_loader.hide();
        }
      }

      var loader = new THREE.OBJLoader( manager );

      /////////////////////////////////////
      var obj;
      loader.load( objModel , function ( objectSrc ) {

        var object = objectSrc.clone();

        object.traverse( function ( child ) {

        if ( child instanceof THREE.Mesh ) {

            var material = new THREE.MeshBasicMaterial( { 
              color: RGBColor,
              side : THREE.DoubleSide
            } );

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

    function update(frame, pixels) {
      var bufView = new Uint8Array(frame);

      for (var i = 0; i < 3*XMLParser.getPixelsQty(); i =  i + 3) {
        var R = bufView[i];
        var G = bufView[i+1];
        var B = bufView[i+2]; 

      changePixelColor(pixels[i/3], R, G, B);
      }
    }

    function render(dt) {
      effect.render(scene, camera);
    }

    function animate(t) {
      setTimeout( function() {
        requestAnimationFrame(animate);

        resize();
        camera.updateProjectionMatrix();
        controls.update(clock.getDelta());
      }, 1000 / 30 );

      render(clock.getDelta());
    }

    function resize() {
      var width = container.offsetWidth;
      var height = container.offsetHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      effect.setSize(width, height);
    }

    function getScene() {
      return scene;
    }

    function getRenderer() {
      return renderer;
    }

    function getCamera() {
      return camera;
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
    getScene: getScene,
    getRenderer: getRenderer,
    getCamera: getCamera
  };
  return oPublic;

}();