import { FC, useEffect } from 'react'
import * as THREE from 'three'
import { Plane, useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { datas } from './Data'
//import { vertexShader, fragmentShader } from './shaders'

export const ScreenPlane: FC = () => {


    const { viewport } = useThree()
    //const texture = useTexture('/no05-super-169.jpg')
    const texture = useTexture('/city1-1.jpg')
    texture.wrapS = THREE.MirroredRepeatWrapping
    texture.wrapT = THREE.MirroredRepeatWrapping

    const textureAspect = texture.image.width / texture.image.height
    const aspect = viewport.aspect
    const ratio = aspect / textureAspect
    const [x, y] = aspect < textureAspect ? [ratio, 1] : [1, 1 / ratio]

    //const texture2 = useTexture('/sky.png')
    const texture2 = useTexture('/city1-2.jpg')
    texture2.wrapS = THREE.MirroredRepeatWrapping
    texture2.wrapT = THREE.MirroredRepeatWrapping

    const shader = {
        uniforms: {
            u_aspect: { value: viewport.aspect },
            u_datas: { value: datas },
            u_texture: { value: texture },
            u_uvScale: { value: new THREE.Vector2(x, y) },
        },
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
    } as const;

    useEffect(() => {
        datas.forEach((data) => {
            data.position.x = THREE.MathUtils.randFloat(12, -12); // xをランダムに設定
            data.position.y = THREE.MathUtils.randFloat(5, -5) // yをランダムに設定
            // ランダムなスピードを設定
        });
    }, []);

    useFrame(() => {
        datas.forEach((data) => {
            const speed = THREE.MathUtils.randFloat(0.12, 0.08)
            data.position.y += speed; // y をランダムスピードで上昇
            //data.position.z -= speed; // z をランダムスピードで上昇
            //data.position.x += speed; // x をランダムスピードで上昇
            data.position.x += THREE.MathUtils.randFloat(-0.01, 0.01);// x をランダムに揺らす
            data.position.z += THREE.MathUtils.randFloat(-0.01, 0.01);

            // y が一定値を超えたら下に戻す
            if (data.position.y > 10) {
                data.position.y = -8; // 再び下から出現させる
                data.position.z = 0;
                data.position.x = THREE.MathUtils.randFloat(12, -12); // x座標もランダムリセット
                //speed = getRandom(0.01, 0.05); // 新しいランダムスピードを設定
            }
        });
    });

    /*useFrame(() => {
        //datas[0].position.y += 1.0;
        //datas[0].position.y = Math.cos(performance.now() / 1000) * 5
        datas.map((data, i) => {
            data.position.y += 0.01
            data.position.x = Math.cos(performance.now() / 1000) * 5
            data.position.z = Math.sin(performance.now() / 1000) * 5
            //data.scale = Math.abs(Math.sin(performance.now() / 1000))
        })
    });*/

    useFrame(() => {
        datas.forEach((data, i) => {
            shader.uniforms.u_datas.value[i].position.copy(data.position)
        })
    })

    return (
        <>
            <ambientLight intensity={1.5} />
            <Plane args={[1, 1]} scale={[viewport.width, viewport.height * 0.9, 1]} position={[0, 0, -0.01]}>
                <meshStandardMaterial attach="material" map={texture2} />
            </Plane>
            <Plane args={[1, 1]} scale={[viewport.width, viewport.height, 1]}>
                <shaderMaterial attach="material" args={[shader]} transparent={true} />
            </Plane>
        </>
    )
    {/* < Sphere args={[40, 64, 64]} scale={[1, 1, 1]} >
            <shaderMaterial attach="material" args={[shader]} />
        </Sphere >*/}
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
uniform Data u_datas[16];
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

    for(int i = 1; i < 16; i++){
        pos = p + -u_datas[i].position * correct;
        float sphere = sdSphere(pos, 0.2 * u_datas[i].scale * 1.6);
        final = onSmoothUnion(final, sphere, 0.05);//0.4
        //final =  min(final, sphere);
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
    //tex = vec4(vec3((tex.r + tex.g + tex.b) / 3.0), tex.a);//これが少し暗くなって良い
    //tex = vec4(0.0, 0.0, 0.0, tex.a);
    //tex = vec4(tex.rgb, 0.3);
    tex = vec4(tex.rgb, 0.0);
    vec4 outgoing = tex;

    if(totalDist < tMax){
        vec3 normal = calcNormal(rayPos);
        float f = fresnel(ray, normal);

        float len = pow(length(normal.xy), 3.0);
        uv += normal.xy * len * 0.1 * 0.8;

        tex = texture2D(u_texture, uv);
        tex += f * 0.3;
        outgoing = tex;
    }
    gl_FragColor = outgoing;
}
`;
