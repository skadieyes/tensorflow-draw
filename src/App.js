import React from 'react';
import * as bodyPix from '@tensorflow-models/body-pix';
import Stats from 'stats.js';
import './App.css';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      net: {},
      video: {},
      eyeAction: false,
      leftHandAction: false,
      rightHandAction: false,
      text: '',
      images: {
        dragon: 'https://i.postimg.cc/qMBfxc8F/dragon.png',
        rainbow: 'https://i.postimg.cc/85Twg4PQ/image.png',
        man: 'https://i.postimg.cc/yNs0Ddq0/image.jpg',
      }
    }
  }
  async componentDidMount() {
    await this.loadBodyPix()
    document.getElementById('loading').style.display = 'none';
    document.getElementById('main').style.display = 'inline-block';
    await this.loadVideo();
    this.segmentBodyInRealTime()
  }
  render() {
    const {  dragon, rainbow, man } = this.state.images
    return (
      <div className="App">
        <div id="stats"> </div>{' '}
        <div
          id="info"
          style={{
            display: 'none',
          }}
        />{' '}
        <div
          id="loading"
          style={{
            display: 'flex',
          }}
        >
          <div className="spinner-text">Loading BodyPix model...</div>{' '}
          <div className="sk-spinner sk-spinner-pulse"> </div>{' '}
        </div>{' '}
        <div
          id="main"
          style={{
            display: 'none',
          }}
        >
          <video
            id="video"
            playsInline
            style={{
              'MozTransform': 'scaleX(-1)',
              'OTransform': 'scaleX(-1)',
              'WebkitTransform': 'scaleX(-1)',
              transform: 'scaleX(-1)',
              display: 'none',
            }}
          />{' '}
          <canvas id="output" />
        </div>
        <div>
            {this.renderSongs() }
        </div>
        <div className="image" style={{ display: 'none' }}>
          <img src={dragon} alt="这是龙" id="dragon"/>
          <img src={rainbow} alt="这是彩虹" id="rainbow" />
        </div>
      </div>
    );
  }
  /**
   * loadBodyfix
   */
  async loadBodyPix() {
    const net = await bodyPix.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      multiplier: 0.75,
      quantBytes: 2
    });
    this.setState({ net })
  }
  /**
   * 初始化camera
   */
  async setUpCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        'Browser API navigator.mediaDevices.getUserMedia not available');
    }
    const videoElement = document.getElementById('video');

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
  }
  /**
   * 播放camera采集到的画面
   */
  async loadVideo(cameraLabel) {
    let video;
    try {
      video = await this.setUpCamera(cameraLabel);
      this.setState({ video })
    } catch (e) {
      let info = document.getElementById('info');
      info.textContent = 'this browser does not support video capture,' +
        'or this device does not have a camera';
      info.style.display = 'block';
      throw e;
    }
    video.play();
  }
  /**
   * 识别身体并画上蒙层
   */
  async segmentBodyInRealTime() {
    const canvas = document.getElementById('output');
    const multiPersonSegmentation = await this.estimateSegmentation();
    const ctx = canvas.getContext('2d');
    const foregroundColor = { r: 255, g: 255, b: 255, a: 255 };
    const backgroundColor = { r: 0, g: 0, b: 0, a: 255 };
    /**
     * bodyPix.toMask
     */
    const mask = bodyPix.toMask(
      multiPersonSegmentation, foregroundColor, backgroundColor,
      true);
    const flipHorizontally = true
    const opacity = 0.5
    const maskBlurAmount = 0
    /**
     * bodyPix.drawMask
     * Draws an image onto a canvas and draws an ImageData containing 
     * a mask on top of it with a specified opacity;
     */
    bodyPix.drawMask(
      canvas, this.state.video, mask, opacity,
      maskBlurAmount, flipHorizontally);
    this.drawPoses(multiPersonSegmentation, flipHorizontally, ctx);
    requestAnimationFrame(this.segmentBodyInRealTime.bind(this))
  }
  async estimateSegmentation() {
    return await this.state.net.segmentMultiPerson(this.state.video, {
      internalResolution: 'medium',
      segmentationThreshold: 0.7,
      maxDetections: 5,
      scoreThreshold: 0.3,
      nmsRadius: 20,
      numKeypointForMatching: 17,
      refineSteps: 10
    });
  }
  drawPoses(personOrPersonPartSegmentation, flipHorizontally, ctx) {
    if (Array.isArray(personOrPersonPartSegmentation)) {
      personOrPersonPartSegmentation.forEach(personSegmentation => {
        let pose = personSegmentation.pose;
        if (flipHorizontally) {
          pose = bodyPix.flipPoseHorizontal(pose, personSegmentation.width);
        }
        this.showPoses(pose.keypoints, 0.3, ctx)
        this.drawKeypoints(pose.keypoints, 0.1, ctx);
      });
    } else {
      personOrPersonPartSegmentation.allPoses.forEach(pose => {
        if (flipHorizontally) {
          pose = bodyPix.flipPoseHorizontal(
            pose, personOrPersonPartSegmentation.width);
        }
        this.drawKeypoints(pose.keypoints, 0.1, ctx);
      })
    }
  }
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
  showPoses(keypoints, minConfidence, ctx) {
    for (let i = 0; i < keypoints.length; i++) {
      const keypoint = keypoints[i];
      /**
       * 分数没有达到
       */
      if (keypoint.score < minConfidence) {
        this.setPoseStatus(keypoint.part, false)
      } else {
        /**
         * 分数满足
         */
        this.setPoseStatus(keypoint.part, true)
        this.drawImage(keypoint, ctx)
      }

    }
  }
  /**
   * pose状态
   */
  setPoseStatus(part, val) {
    let { leftHandAction, rightHandAction } = this.state
    switch (part) {
      case 'rightWrist':
        rightHandAction = val
        break;
      case 'leftWrist':
        leftHandAction = val
        break;
      default:
        break;
    }
    this.setState({
      leftHandAction,
      rightHandAction
    })
  }

  /**
   * 画图形
   */
  drawImage(keypoint, ctx) {
    switch (keypoint.part) {
      case 'rightWrist':
        const rainbow = document.getElementById("rainbow");
        ctx.drawImage(rainbow, keypoint.position.x - 50, keypoint.position.y, 120, 100)
        break;
      case 'leftWrist':
        const dragon = document.getElementById("dragon");
        ctx.drawImage(dragon, keypoint.position.x - 50, keypoint.position.y - 20, 100, 100)
        break;
      default:
        break;
    }
  }

  drawPoint(ctx, y, x, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }
  renderSongs() {
    const { leftHandAction, rightHandAction } = this.state
    if (leftHandAction) {
      return '来左边儿 跟我一起画个龙'
    } else if (rightHandAction) {
      return '在你右边儿 画一道彩虹'
    }
  }
}

export default App;
