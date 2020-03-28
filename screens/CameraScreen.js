import React, { useState, useEffect, createRef } from 'react';
import PropTypes from 'prop-types';
import {
  Platform,
  View,
  StyleSheet,
} from 'react-native';
import {
  Portal,
  Text,
  FAB,
} from 'react-native-paper';
import { Camera } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';

export function hasWebCamera() {
  return !!navigator.mediaDevices;
}

function CoreCamera({
  pictureOptions,
}) {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [hasCamera, setHasCamera] = useState(undefined);

  const isFocused = useIsFocused();
  const camera = createRef();
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        let types = null;
        try {
          types = await Camera.getAvailableCameraTypesAsync();
          alert(JSON.stringify({ types }));
        } catch (error) {
          alert(JSON.stringify({ types, error: error.message }));
        }

        const constraints = {
          audio: false,
          video: { width: window.innerWidth, height: window.innerHeight },
        };
        if (!hasWebCamera()) {
          setHasCamera(false);
          if (__DEV__) { // eslint-disable-line no-undef
            alert('camera.notSecure');
          }
        } else {
          try {
            const stream = await navigator.mediaDevices
              .getUserMedia(constraints);
            if (stream) {
              setHasCamera(true);
            } else {
              setHasCamera(false);
            }
          } catch (error) {
            setHasCamera(false);
          }
        }
        setHasPermission(true);
      } else {
        const { status } = await Camera.requestPermissionsAsync();
        setHasPermission(status === 'granted');
      }
    })();
  }, []);

  const takePicture = async () => {
    try {
      if (camera) {
        const data = await camera.current.takePictureAsync(pictureOptions);
        console.log(JSON.stringify(data));
      }
    } catch (err) {
      console.log(JSON.stringify({ error: true, err, message: err.message }));
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={styles.container}
        type={type}
      >
        <Portal>
          <FAB.Group
            visible={isFocused}
            open={Platform.OS !== 'web'}
            icon="camera"
            actions={[
              {
                icon: 'camera-switch',
                onPress: () => {
                  setType(
                    type === Camera.Constants.Type.back
                      ? Camera.Constants.Type.front
                      : Camera.Constants.Type.back,
                  );
                },
              },
            ]}
            onStateChange={() => {} /* required! */}
            onPress={takePicture}
          />
        </Portal>
      </Camera>
    </View>
  );
}

CoreCamera.propTypes = {
  /** Pictures options as described here https://docs.expo.io/versions/v36.0.0/sdk/camera/#takepictureasync */
  pictureOptions: PropTypes.shape({
    /** Specify the quality of compression, from 0 to 1. 0 means compress for small size, 1 means compress for maximum quality. */
    quality: PropTypes.number,
    /** Whether to also include the image data in Base64 format. */
    base64: PropTypes.bool,
    /**  Whether to also include the EXIF data for the image. */
    exif: PropTypes.bool,
    /**
     * A callback invoked when picture is saved.
     * If set, the promise of this method will resolve immediately with no data after picture is captured.
     * The data that it should contain will be passed to this callback.
     * If displaying or processing a captured photo right after taking it is not your case,
     * this callback lets you skip waiting for it to be saved.
     */
    onPictureSaved: PropTypes.func,
    /**
     * Android only. If set to true, camera skips orientation adjustment and returns an image straight from the device's camera.
     * If enabled, quality option is discarded (processing pipeline is skipped as a whole). Although enabling this option reduces image delivery time significantly, it may cause the image to appear in a wrong orientation in the Image component (at the time of writing,
     * it does not respect EXIF orientation of the images).
     */
    skipProcessing: PropTypes.bool,
  }),
};

CoreCamera.defaultProps = {
  pictureOptions: {
    quality: 5,
    base64: true,
    exif: false,
    onPictureSaved: undefined,
    skipProcessing: false,
  },
};

export default CoreCamera;
