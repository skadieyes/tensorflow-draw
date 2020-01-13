# TensorFlow App
> React, TensorFlow.js

## what
> 这是一个和tensorlfow结合的小应用

## How
1. 在项目中引入BodyPix, 可以实时分割人体和身体部位的Model
[git/body-pix](https://github.com/tensorflow/tfjs-models/tree/master/body-pix)
```javascript
    import * as bodyPix from '@tensorflow-models/body-pix';
    const net = await bodyPix.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      multiplier: 0.75,
      quantBytes: 2
    });
    this.setState({ net })
```

2. 获取媒体输入相机，并播放相机输入的画面
```javascript
    const stream = await navigator.mediaDevices.getUserMedia(
        { 'audio': false, 'video': true });
    videoElement.srcObject = stream;
    return new Promise((resolve) => {
      videoElement.onloadedmetadata = () => {
        videoElement.width = videoElement.videoWidth;
        videoElement.height = videoElement.videoHeight;
        resolve(videoElement);
      };
    });
```

3. 识别身体并画上蒙层

4. 识别身体每个部位，达到一定分数，画上点

5. 识别左手，右手，分别画上彩虹和龙

6. requestAnimationFrame，不断根据相机实时输入重新绘制
