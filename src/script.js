import { TorusKnotGeometry, Scene, Mesh, PerspectiveCamera, TextureLoader, MirroredRepeatWrapping, NearestFilter } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import WebGPU from 'three/addons/capabilities/WebGPU.js'
import WebGL from 'three/addons/capabilities/WebGL.js'
import WebGPURenderer from 'three/addons/renderers/webgpu/WebGPURenderer.js'
import { 
    MeshStandardNodeMaterial,
    cameraPosition,
    positionWorld,
    normalize,
    normalWorld,
    uv,
    uniform,
    vec3,
    dot,
    saturate,
    pow,
    max,
    color,
    vec4,
    mix,
    texture,
    varying,
    diffuseColor,
    linearTosRGB,
    triplanarTexture
} from 'three/examples/jsm/nodes/Nodes.js'

/**
 * Base
 */

const noise = new TextureLoader().load( './images/noise-voronoi.png' ) // default texture
const sparkleScale = uniform( 5 ) // scale up noise size
const sparkleIntensity = uniform( 200 ) // intensity of sparkles
const baseColor = uniform( color( '#800080' ) ) // base color
const fresnelColor = uniform( color ( '#e1c564' ) ) // fresnel color
const sparkleColor = uniform( color( '#e1c564' ) ) // sparkle color
const fresenlAmt = uniform( 3 ) // amount of fresnel
const fresnelAlpha = uniform( 0.5 ) // fresnel alpha
const fresnelIntensity = uniform( 1 ) // brightness of fresnel

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new Scene()

// enable webgpu

/**
 * Test mesh
 */
// Geometry
const geometry = new TorusKnotGeometry( 0.3, 0.1, 100, 16 )

// Material
 //material
 const material = new MeshStandardNodeMaterial()

 noise.wrapS = MirroredRepeatWrapping
 noise.wrapT = MirroredRepeatWrapping
 noise.magFilter = NearestFilter
 noise.minFilter = NearestFilter

const uvs = uv()
//uvs.mul( sparkleScale )
const viewDirection = positionWorld.sub( cameraPosition ).normalize()
const diffuseView = cameraPosition.sub( positionWorld ).normalize()
const normals = normalWorld.normalize()

// texture
const textureNoise = texture( noise, uvs )
const textureSparkles = triplanarTexture( textureNoise, null, null, sparkleScale ).rgb
textureSparkles.sub( 0.5 )
const mapSparkles = normalize( textureSparkles.add( normals.normalize() ) )

// diffuse calculations
const diffuse = max( normals.dot( diffuseView ), 0.0 )
// fresnel calculations
const fresnel = pow( normals.dot( viewDirection ).oneMinus(), fresenlAmt )
const negativeView = viewDirection.negate()
// sparkles
let sparkles = dot( negativeView, mapSparkles ).saturate()
sparkles = pow( sparkles, sparkleIntensity )

//Colors

// fresnel Color
const colorFresnel = vec4( fresnelColor.rgb.mul( fresnel ), 1.0 )
colorFresnel.rgb.mul( fresnelIntensity )
// diffuse Color
const colorDiffuse = vec4( baseColor.mul( diffuse ), 1.0 )
// sparkles color
const colorSparkles = vec4( sparkleColor.mul( sparkles ), 1.0 )

// final ouput color
let colorFinal =  colorDiffuse
colorFinal.add( colorSparkles )
colorFinal.mix( fresnelColor, fresnel )
colorFinal = colorFresnel

material.colorNode = colorFinal
console.log( material )



// Mesh
const mesh = new Mesh(geometry, material)
scene.add(mesh)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0.25, - 0.25, 1)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new WebGPURenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */

const tick = () =>
{
    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
    
}

tick()