
// init renderer
const renderer	= new THREE.WebGLRenderer({
  // antialias	: true,
  alpha: true
});
renderer.setClearColor(new THREE.Color('lightgrey'), 0)
// renderer.setPixelRatio( 1/2 );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.domElement.style.position = 'absolute'
renderer.domElement.style.top = '0px'
renderer.domElement.style.left = '0px'
document.body.appendChild( renderer.domElement );
// array of functions for the rendering loop
const onRenderFcts= [];
// init scene and camera
const scene	= new THREE.Scene();

// create a camera
const camera = new THREE.Camera();
scene.add(camera);

//handle arToolkitSource
const arToolkitSource = new THREEx.ArToolkitSource({
  // to read from the webcam
  sourceType : 'webcam',
  // to read from an image
  // sourceType : 'image',
  // sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/images/img.jpg',
  // to read from a video
  // sourceType : 'video',
  // sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/videos/headtracking.mp4',
})
arToolkitSource.init(function onReady(){
  onResize()
})

// handle resize
window.addEventListener('resize', function(){
  onResize()
})
function onResize(){
  arToolkitSource.onResize()
  arToolkitSource.copySizeTo(renderer.domElement)
  if( arToolkitContext.arController !== null ){
    arToolkitSource.copySizeTo(arToolkitContext.arController.canvas)
  }
}


// create atToolkitContext
var arToolkitContext = new THREEx.ArToolkitContext({
  cameraParametersUrl: THREEx.ArToolkitContext.baseURL + '../other/camera_para.dat',
  detectionMode: 'mono',
  maxDetectionRate: 30,
  canvasWidth: 80*3,
  canvasHeight: 60*3,
})
// initialize it
arToolkitContext.init(function onCompleted(){
  // copy projection matrix to camera
  camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
})
// update artoolkit on every frame
onRenderFcts.push(function(){
  if( arToolkitSource.ready === false )	return
  arToolkitContext.update( arToolkitSource.domElement )
})


////////////////////////////////////////////////////////////////////////////////
//          Create a ArMarkerControls
////////////////////////////////////////////////////////////////////////////////

var markerRoot = new THREE.Group
scene.add(markerRoot)
var artoolkitMarker = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
  type : 'pattern',
  patternUrl : THREEx.ArToolkitContext.baseURL + '../image/patern-marker.patt'
  // patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji'
})
// build a smoothedControls
var smoothedRoot = new THREE.Group()
scene.add(smoothedRoot)
var smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
  lerpPosition: 0.4,
  lerpQuaternion: 0.3,
  lerpScale: 1,
})
onRenderFcts.push(function(delta){
  smoothedControls.update(markerRoot)
})


//add an object in the scene
var arWorldRoot = smoothedRoot
// add a torus knot
var geometry	= new THREE.CubeGeometry(1,1,1);
var material	= new THREE.MeshNormalMaterial({
  transparent : true,
  opacity: 0.5,
  side: THREE.DoubleSide
});
var mesh	= new THREE.Mesh( geometry, material );
mesh.position.y	= geometry.parameters.height/2
arWorldRoot.add( mesh );

var geometry	= new THREE.TorusKnotGeometry(0.3,0.1,64,16);
var material	= new THREE.MeshNormalMaterial();
var mesh	= new THREE.Mesh( geometry, material );
mesh.position.y	= 0.5
arWorldRoot.add( mesh );

onRenderFcts.push(function(){
  mesh.rotation.x += 0.1
})

//render the whole thing on the page
var stats = new Stats();
document.body.appendChild( stats.dom );
// render the scene
onRenderFcts.push(function(){
  renderer.render( scene, camera );
  stats.update();
})
// run the rendering loop
var lastTimeMsec= null
requestAnimationFrame(function animate(nowMsec){
  // keep looping
  requestAnimationFrame( animate );
  // measure time
  lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
  var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
  lastTimeMsec	= nowMsec
  // call each update function
  onRenderFcts.forEach(function(onRenderFct){
    onRenderFct(deltaMsec/1000, nowMsec/1000)
  })
})
