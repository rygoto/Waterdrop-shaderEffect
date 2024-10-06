import React, { FC } from 'react'
import * as THREE from 'three'
import { Plane, useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { datas } from './Data'
//import { vertexShader, fragmentShader } from './shaders'

export const ScreenPlane: FC = () => {


    const { viewport } = useThree()
    //const texture = useTexture('/wlop.jpg')
    const texture = useTexture('/no05-super-169.jpg')
    //const texture = useTexture(publicPath('/assets/images/wlop.jpg'))
    //texture.encoding = THREE.sRGBEncoding
    texture.wrapS = THREE.MirroredRepeatWrapping
    texture.wrapT = THREE.MirroredRepeatWrapping

    const textureAspect = texture.image.width / texture.image.height
    const aspect = viewport.aspect
    const ratio = aspect / textureAspect
    const [x, y] = aspect < textureAspect ? [ratio, 1] : [1, 1 / ratio]

    const shader: THREE.ShaderMaterialParameters = {
        uniforms: {
            u_aspect: { value: viewport.aspect },
            u_datas: { value: datas },
            u_texture: { value: texture },
            u_uvScale: { value: new THREE.Vector2(x, y) },
        },
        vertexShader,
        fragmentShader,
    }


    useFrame(() => {
        datas.forEach((data, i) => {
            shader.uniforms.u_datas.value[i].position.copy(data.position)
        })
    })

    return (
        <Plane args={[1, 1]} scale={[viewport.width, viewport.height, 1]}>
            <shaderMaterial attach="material" args={[shader]} />
        </Plane>
    )
}

const vertexShader = `
varying vec2 v_uv;

void main(){
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
}
`;

const fragmentShader = `
struct Data {
    vec3 position;
    float scale;
};

uniform float u_aspect;
uniform Data u_datas[5];
uniform sampler2D u_texture;
uniform vec2 u_uvScale;
varying vec2 v_uv;

float sdSphere(vec3 p,float s){
        return length(p) - s;
    }

float onSmoothUnion(float d1, float d2, float k){
        float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
        return mix(d2, d1, h) - k * h * (1.0 - h);
    }  



float sdf(vec3 p){
    vec3 correct = vec3(u_aspect, 1.0, 1.0) * vec3(0.08, 0.15, 0.2);

    vec3 pos = p + -u_datas[0].position * correct;
    float final = sdSphere(pos, u_datas[0].scale); 

    for(int i = 1; i < 5; i++){
        pos = p + -u_datas[i].position * correct;
        float sphere = sdSphere(pos, 0.2 * u_datas[i].scale);
        final = onSmoothUnion(final, sphere, 0.4);
    }
    return final;
}

vec3 calcNormal(in vec3 p){
        const float h = 0.0001;
        const vec2 k = vec2(1, -1) * h;
        return normalize( k.xyy * sdf( p + k.xyy ) + 
                          k.yyx * sdf( p + k.yyx ) + 
                          k.yxy * sdf( p + k.yxy ) + 
                          k.xxx * sdf( p + k.xxx ) );
    }


float fresnel(vec3 eye, vec3 normal){
        return pow(1.0 + dot(eye, normal), 3.0);
    }
    

void main(){
    vec2 centeredUV = (v_uv - 0.5) * vec2(u_aspect, 1.0);
    vec3 ray = normalize(vec3(centeredUV, -1.0));

    vec3 camPos = vec3(0.0, 0.0, 2.3);
    vec3 rayPos = camPos;
    float totalDist = 0.0;
    float tMax = 5.0;

    for(int i = 0; i < 256; i++){
        float dist = sdf(rayPos);
        if(dist < 0.0001 || totalDist > tMax) break;
        totalDist += dist;
        rayPos = camPos + totalDist * ray;    
    }

    vec2 uv = (v_uv - 0.5) * u_uvScale + 0.5;
    vec4 tex = texture2D(u_texture, uv);
    tex = vec4(vec3((tex.r + tex.g + tex.b) / 3.0), tex.a);
    vec4 outgoing = tex;

    if(totalDist < tMax){
        vec3 normal = calcNormal(rayPos);
        float f = fresnel(ray, normal);

        float len = pow(length(normal.xy), 3.0);
        uv += normal.xy * len * 0.1;

        tex = texture2D(u_texture, uv);
        tex += f * 0.3;
        outgoing = tex;
    }
    gl_FragColor = outgoing;
}


`;
