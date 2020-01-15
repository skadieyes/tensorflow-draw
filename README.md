# TensorFlow App
> React, TensorFlow.js

## what
> 这是一个和tensorlfow结合的小应用
> :heart: [LiveDemo](https://skadieyes.github.io/tensorflow-app/)
> 在屏幕中露出的你 左手腕 或者 右手腕，来试试看吧

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
    const stream = await navigator.mediaDevices.getUserMedia({ 'audio': false, 'video': true });
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
```javascript
    bodyPix.drawMask(
      canvas, this.state.video, mask, opacity,
      maskBlurAmount, flipHorizontally);
```
4. 识别身体每个部位

5. 达到一定分数，画上点
```javascript
drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
    for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];
      if (keypoint.score < minConfidence) {
        continue;
      }
      const { y, x } = keypoint.position;
      this.drawPoint(ctx, y * scale, x * scale, 3, 'aqua');
    }
}
```

6. 识别左手，右手，分别画上彩虹和龙
```javascript
 showPoses(keypoints, minConfidence, ctx) {
    for (let i = 0; i < keypoints.length; i++) {
      const keypoint = keypoints[i];
    /** 分数没有达到 **/
    if (keypoint.score < minConfidence) {
      this.setPoseStatus(keypoint.part, false)
    } else {
    /** 分数满足 **/
      this.setPoseStatus(keypoint.part, true)
      this.drawImage(keypoint, ctx)
    }
  }
 }
```

7. requestAnimationFrame，不断根据相机实时输入重新绘制
```javascript
  requestAnimationFrame(this.segmentBodyInRealTime.bind(this))
```
