import * as THREE from 'three';

export type Data = {
    position: THREE.Vector3
    scale: number
}

export const datas: Data[] = [...Array(16)].map(() => {
    const position = new THREE.Vector3(THREE.MathUtils.randFloat(-5, 5), THREE.MathUtils.randFloat(-5, 5), 0)
    const scale = THREE.MathUtils.randFloat(0.5, 0.6)
    return { position, scale }
})
