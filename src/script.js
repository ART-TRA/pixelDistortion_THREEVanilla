import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Clock } from 'three'
import * as dat from 'dat.gui'
import texture from './images/BladeRunner.jpg'

import vertexShader from './shaders/test/vertex.glsl'
import fragmentShader from './shaders/test/fragment.glsl'

let mouse = {
  x: 0,
  y: 0,
  prevX: 0,
  prevY: 0,
  velocityX: 0, //скорость
  velocityY: 0
}
const clock = new Clock()

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()
const frustumSize = 1;
const camera = new THREE.OrthographicCamera(
  frustumSize / -2,
  frustumSize / 2,
  frustumSize / 2,
  frustumSize / -2,
  -1000,
  1000
)
// const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.01, 1000)
camera.position.set(0, 0, 2)
scene.add(camera)
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true //плавность вращения камеры

const renderer = new THREE.WebGLRenderer({
  canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) //ограничение кол-ва рендеров в завис-ти от плотности пикселей
// renderer.setClearColor('#1f1f25', 1)
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;

window.addEventListener('resize', () => {
  //update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  //update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  //update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

window.addEventListener('mousemove', (event) => {
  mouse.x = event.clientX / window.innerWidth
  mouse.y = event.clientY / window.innerHeight

  mouse.velocityX = mouse.x - mouse.prevX
  mouse.velocityY = mouse.y - mouse.prevY

  mouse.prevX = mouse.x
  mouse.prevY = mouse.y
})

//------------------------------------------------------------------------------------------------------
const widthPixels = 128;
const heightPixels = 64;

const size = widthPixels * heightPixels;
const data = new Float32Array(3 * size);
const color = new THREE.Color(0xffffff);

const r = Math.floor(color.r * 255);
const g = Math.floor(color.g * 255);
const b = Math.floor(color.b * 255);

for (let i = 0; i < size; i++) {
  let r = Math.random() * 255 //чем больше числовой коэф, тем больше искажение
  const stride = i * 3;

  data[stride] = r;
  data[stride + 1] = r;
  data[stride + 2] = r;
}

// used the buffer to create a DataTexture

const dataTexture = new THREE.DataTexture(data, widthPixels, heightPixels, THREE.RGBFormat, THREE.FloatType);
dataTexture.magFilter = dataTexture.minFilter = THREE.NearestFilter
dataTexture.needsUpdate = true;

const geometry = new THREE.PlaneBufferGeometry(1, 1)
const material = new THREE.ShaderMaterial({
  side: THREE.DoubleSide,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  uniforms: {
    uTime: {value: 0},
    uMouse: {value: new THREE.Vector2(mouse.x, mouse.y)},
    uTexture: {value: new THREE.TextureLoader().load(texture)},
    uDataTexture: {value: dataTexture},
    uResolution: {value: new THREE.Vector4()}
  }
})

const particle = new THREE.Mesh(geometry, material)
scene.add(particle)

//анимация движения пикселей
const updateDataTexture = () => {
  let data = dataTexture.image.data //кол-во пикселей в изобр-и
  for (let i = 0; i < data.length; i+=3) {
    data[i] *= 0.9 //если здесь будет 0, то пиксели вернутся на первонач позицию по х
    data[i + 1] *= 0.9 //если здесь будет 0, то пиксели вернутся на первонач позицию по y
  }

  let gridMouseX = widthPixels * mouse.x
  let gridMouseY = heightPixels * (1 - mouse.y)
  let maxDist = 10

  for (let i = 0; i < widthPixels; ++i) {
    for (let j = 0; j < heightPixels; ++j) {
      let distance = (gridMouseX - i)**2 +  (gridMouseY - j)**2
      let maxDistSq = maxDist**2

      if (distance < maxDistSq) {
        let index = 3 * (i + widthPixels*j)
        let power = maxDist/Math.sqrt(distance)
        if (distance < 1) power = 1

        data[index] += 100 * mouse.velocityX * power
        data[index + 1] -= 100 * mouse.velocityY * power
      }
    }
  }

  mouse.velocityX *= 0.9
  mouse.velocityY *= 0.9
  dataTexture.needsUpdate = true
}

//---------------------------------------------------------------------------------------------------------

const tick = () => {
  const elapsedTime = clock.getElapsedTime()
  material.uniforms.uTime.value = elapsedTime

  let a1, a2
  let imageAspect = 1200 / 2864
  if (sizes.height / sizes.width > imageAspect) {
    a1 = (sizes.width / sizes.height) * imageAspect
    a2 = 1
  } else {
    a1 = 1
    a2 = (sizes.height / sizes.width) / imageAspect
  }

  material.uniforms.uResolution.value.x = sizes.width
  material.uniforms.uResolution.value.y = sizes.height
  material.uniforms.uResolution.value.z = a1
  material.uniforms.uResolution.value.w = a2

  updateDataTexture()

  //Update controls
  // controls.update() //если включён Damping для камеры необходимо её обновлять в каждом кадре

  renderer.render(scene, camera)
  window.requestAnimationFrame(tick)
}

tick()