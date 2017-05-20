// jshint esnext: true
$(document).ready(onLoad);

Math.square = (value) => value * value;
Math.magnitude = (u,v) => Math.sqrt(Math.square(v) + Math.square(u));

function onLoad() {
    // Grab elements, create settings, etc.
    var video = $('#video')[0];
    var videoCanvas= $('#video-canvas')[0];
    var videoContext = videoCanvas.getContext('2d');
    
    // Get access to the camera!
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Not adding `{ audio: true }` since we only want video now
        navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
            video.src = window.URL.createObjectURL(stream);
            video.play();
        });
    }
    
    /* Legacy code below: getUserMedia 
    else if(navigator.getUserMedia) { // Standard
        navigator.getUserMedia({ video: true }, function(stream) {
            video.src = stream;
            video.play();
        }, errBack);
    } else if(navigator.webkitGetUserMedia) { // WebKit-prefixed
        navigator.webkitGetUserMedia({ video: true }, function(stream){
            video.src = window.webkitURL.createObjectURL(stream);
            video.play();
        }, errBack);
    } else if(navigator.mozGetUserMedia) { // Mozilla-prefixed
        navigator.mozGetUserMedia({ video: true }, function(stream){
            video.src = window.URL.createObjectURL(stream);
            video.play();
        }, errBack);
    }
    */

    //$(window).resize(onResize);
    onResize();
    //setInterval(onResize, 1000);
    setInterval(trackFaces, 1000);
    setInterval(renderKim, 1000);

    var hasExecutedFirstContentResize = false;

    var draw = function(video, dt) {
        if (!hasExecutedFirstContentResize) {
            hasExecutedFirstContentResize = true;
            onResize();
            trackFaces();
        }
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            videoContext.drawImage(video, 0, 0); //, context.canvas.width, context.canvas.height);
            //track();
        }
    };
    var myCamvas = new camvas(videoContext, draw);
    //video.addEventListener(
    //        'play', 
    //        () => {
    //            draw(this, videoContext);
    //        },
    //        false);
}

function onResize() {
    var video = $('#video')[0];
    var actualVideoDimensions = calculateActualVideoDimensions(video);

    var videoCanvas = $('#video-canvas')[0];
    videoCanvas.style.position = "absolute";
    videoCanvas.style.left = ((window.innerWidth / 2) - (actualVideoDimensions.width / 2)) + 'px';
    videoCanvas.style.top = ((window.innerHeight / 2) - (actualVideoDimensions.height / 2)) + 'px';
    videoCanvas.style.width = actualVideoDimensions.width + 'px';
    videoCanvas.style.height = actualVideoDimensions.height + 'px';
    videoCanvas.width  = actualVideoDimensions.width;
    videoCanvas.height = actualVideoDimensions.height;
}

// from: https://stackoverflow.com/questions/17056654/getting-the-real-html5-video-width-and-height 
function calculateActualVideoDimensions(video) {
    // Ratio of the video's intrisic dimensions
    var videoRatio = video.videoWidth / video.videoHeight;
    // The width and height of the video element
    var width = video.offsetWidth, height = video.offsetHeight;
    // The ratio of the element's width to its height
    var elementRatio = width/height;
    // If the video element is short and wide
    if(elementRatio > videoRatio) width = height * videoRatio;
    // It must be tall and thin, or exactly equal to the original ratio
    else height = width / videoRatio;
    return {
        width: width,
        height: height };
}

function trackFaces() {
    var video = $('#video')[0];
    var actualVideoDimensions = calculateActualVideoDimensions(video);
    var videoBoundingRect = video.getBoundingClientRect();
    //var extraRatioX = (actualVideoDimensions.width / videoBoundingRect.width);
    //var extraRatioY = (actualVideoDimensions.height / videoBoundingRect.height);

    if (actualVideoDimensions.width < 1 || actualVideoDimensions.height < 1) {
        return;
    }

    var videoCanvas = $('#video-canvas')[0];
    if (videoCanvas.width < 1 || videoCanvas.height < 1) {
        return;
    }
    var videoContext = videoCanvas.getContext('2d');

    //maskContext.strokeStyle = 'red';
    $('#video-canvas').faceDetection({
        complete: function (faces) {
            if (! Array.isArray(faces)) {
                return;
            }
            if (faces.length > 0) {
                var face = faces[Math.floor(Math.random() * faces.length)];
                try {
                    var blockData = videoContext.getImageData(
                        Math.trunc(face.x), Math.trunc(face.y), 
                        Math.trunc(face.width), Math.trunc(face.height));
                    FACE_BLOCK_DATA = blockData;
                    //transformFaceBlock(blockData);
                    //maskContext.putImageData(blockData, face.x, face.y);
                    //maskContext.strokeRect(
                    //    face.x,
                    //    face.y,
                    //    face.width,
                    //    face.height);
                    //face.x * face.scaleX * extraRatioX,
                    //face.y * face.scaleY * extraRatioY, 
                    //face.width * face.scaleX * extraRatioX, 
                    //face.height * face.scaleY * extraRatioY);
                }
                catch (err) {
                    console.error(err);
                }
            }
        }
    });
}

var FACE_BLOCK_DATA;
var KIM_FACE_HORIZ_RANGE = [174, 280];
var KIM_FACE_VERT_RANGE = [85, 215];

function renderKim() {
    if (FACE_BLOCK_DATA === undefined) {
        return;
    }

    var kimImg = $('#kim-img')[0];
    var kimCanvas = $('#kim-canvas')[0];
    var kimContext = kimCanvas.getContext('2d');

    kimCanvas.style.position = "absolute";
    kimCanvas.style.left = pixels((window.innerWidth / 2) - (kimImg.width / 2));
    kimCanvas.style.top = pixels((window.innerHeight / 2) - (kimImg.height / 2));
    kimCanvas.style.width = pixels(kimImg.width);
    kimCanvas.style.height = pixels(kimImg.height);
    kimCanvas.width = kimImg.width;
    kimCanvas.height = kimImg.height;

    kimContext.clearRect(0, 0, kimCanvas.width, kimCanvas.height);
    kimContext.drawImage(kimImg, 0, 0);

    var scaledFaceBlock = scaleKimFaceBlock(kimContext, FACE_BLOCK_DATA);
    kimContext.putImageData(scaledFaceBlock, KIM_FACE_HORIZ_RANGE[0], KIM_FACE_VERT_RANGE[0]); 
    kimContext.drawImage(kimImg, 0, 0);
}

function pixels(value) {
    return value + "px";
}

function scaleKimFaceBlock(context, trackedBlockData) {
    var width = KIM_FACE_HORIZ_RANGE[1] - KIM_FACE_HORIZ_RANGE[0];
    var height = KIM_FACE_VERT_RANGE[1] - KIM_FACE_VERT_RANGE[0];
    var blockData = context.createImageData(width, height);
    for (var y = 0, i = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var trackedBlockX = Math.trunc((x / width) * trackedBlockData.width);
            var trackedBlockY = Math.trunc((y / height) * trackedBlockData.height);
            var trackedBlockIndex = ((trackedBlockY * trackedBlockData.width) + trackedBlockX) * 4;
            blockData.data[i++] = trackedBlockData.data[trackedBlockIndex++];
            blockData.data[i++] = trackedBlockData.data[trackedBlockIndex++];
            blockData.data[i++] = trackedBlockData.data[trackedBlockIndex++];
            blockData.data[i++] = trackedBlockData.data[trackedBlockIndex++];
        }
    }
    console.log(blockData);
    return blockData;
}
