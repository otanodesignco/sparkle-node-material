import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import WebGPU from 'three/addons/capabilities/WebGPU.js'
import WebGL from 'three/addons/capabilities/WebGL.js'
import WebGPURenderer from 'three/addons/renderers/webgpu/WebGPURenderer.js'
import { 
    MeshBasicNodeMaterial,
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
    texture
} from 'three/examples/jsm/nodes/Nodes.js'

/**
 * Base
 */

const noise = './images/noise.png' // default texture
const sparkleScale = 1 // scale up noise size
const sparkleIntensity = 90.0 // intensity of sparkles
const baseColor = '#101010' // base color
const fresnelColor = '#e1c564' // fresnel color
const sparkleColor = '#e1c564' // sparkle color
const fresenlAmt = 10.0 // amount of fresnel
const fresnelAlpha = 0.25 // fresnel alpha
const fresnelIntensity = 5.0 // brightness of fresnel

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// enable webgpu

/**
 * Test mesh
 */
// Geometry
const geometry = new THREE.SphereGeometry( 3 )

// Material
 //material
 const material = new MeshBasicNodeMaterial()
 // uniforms
 const textureScale = uniform( sparkleScale )
 const sparkIntensity = uniform( sparkleIntensity )
 const fresnelFactor = uniform( fresenlAmt )
 const fresnelBrightness = uniform( fresnelIntensity )
 const fresnelAlphaAmt = uniform( fresnelAlpha )
 // view calculations
 const viewDirection = normalize( positionWorld - cameraPosition )
 const diffuseView = normalize( cameraPosition - positionWorld )
 const normalizedWNormals = normalize( normalWorld )
 // sparkle texture
 const sparkleTexture = texture( noise, uv * textureScale )
 let sparkleMap = sparkleTexture.rgb
 sparkleMap -= vec3( 0.5 )
 sparkleMap = normalize( normalize( sparkleMap ) + normalizedWNormals )

 // sparkle calculations
 let sparkles = dot( -viewDirection, sparkleMap )
 sparkles = saturate( sparkles )
 sparkles = pow( sparkles, sparkIntensity )

 //fresnel & diffuse calculation
 let fresnel = dot( normalizedWNormals, viewDirection ) + 1.0
 let diffuse = dot( normalizedWNormals, diffuseView )
 fresnel = pow( fresnel, fresnelFactor )
 diffuse = max( diffuse, 0.0 )

 // color calculations
 let diffuseColor = color( baseColor )
 const rimLightColor = color( fresnelColor )
 let fresnelColorFin = vec4( rimLightColor.r, rimLightColor.b, rimLightColor.g, 1.0 )
 let finalColor = vec4( diffuseColor.r, diffuseColor.b, diffuseColor.g , 1.0 )
 const sparkColor = color( sparkleColor )
 const sparkleColorFin = vec4( sparkColor.r, sparkColor.g, sparkColor.b, 0.0 )
 diffuseColor *= diffuse
 fresnelColorFin = fresnelColorFin.mul( vec4( fresnel, fresnel, fresnel, 1.0 ) )
 fresnelColorFin.mul( fresnelBrightness )
 sparkleColorFin.rgb.mul( sparkles )
 finalColor.add( sparkleColorFin )
 finalColor = mix( finalColor, fresnelColorFin, fresnel * fresnelAlphaAmt )

 material.colorNode = finalColor

// Mesh
const mesh = new THREE.Mesh(geometry, material)
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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
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