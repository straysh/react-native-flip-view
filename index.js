'use strict'

var React = require('react')
var {
  Component,
  PropTypes
} = React

var ReactNative = require('react-native')
var {
  View,
  Easing,
  StyleSheet,
  Animated,
  Platform
} = ReactNative

export default class FlipView extends Component {
  static propTypes = {
    style: View.propTypes.style,
    flipDuration: PropTypes.number,
    flipEasing: PropTypes.func,
    flipAxis: PropTypes.oneOf(['x', 'y']),
    front: PropTypes.object,
    back: PropTypes.object,
    perspective: PropTypes.number,
    onFlip: PropTypes.func,
    onFlipped: PropTypes.func,
    isFlipped: PropTypes.bool
  };

  static defaultProps = {
    style: {},
    flipDuration: 500,
    flipEasing: Easing.out(Easing.ease),
    flipAxis: 'y',
    perspective: 1000,
    onFlip: () => {},
    onFlipped: () => {},
    isFlipped: false
  };

  constructor (props) {
    super(props)

    const targetRenderState = this._getTargetRenderStateFromFlippedValue(
      props.isFlipped
    )

    const frontRotationAnimatedValue = new Animated.Value(
      targetRenderState.frontRotation
    )
    const backRotationAnimatedValue = new Animated.Value(
      targetRenderState.backRotation
    )

    const frontOpacityAnimatedValue = new Animated.Value(
      targetRenderState.frontOpacity
    )
    const backOpacityAnimatedValue = new Animated.Value(
      targetRenderState.backOpacity
    )

    const interpolationConfig = {
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
    }
    const frontRotation = frontRotationAnimatedValue.interpolate(
      interpolationConfig
    )
    const backRotation = backRotationAnimatedValue.interpolate(
      interpolationConfig
    )

    const opacityInterpolationConfig = {
      inputRange: [0, 1],
      outputRange: [0, 1]
    }
    const frontOpacity = frontOpacityAnimatedValue.interpolate(
      opacityInterpolationConfig
    )
    const backOpacity = backOpacityAnimatedValue.interpolate(
      opacityInterpolationConfig
    )

    this.state = {
      frontRotationAnimatedValue,
      backRotationAnimatedValue,
      frontRotation,
      backRotation,
      isFlipped: props.isFlipped
    }

    if (Platform.OS === 'android') {
      Object.assign(this.state, {
        frontOpacityAnimatedValue,
        backOpacityAnimatedValue,
        frontOpacity,
        backOpacity
      })
    }
  }

  componentWillReceiveProps = nextProps => {
    if (nextProps.isFlipped !== this.props.isFlipped) {
      this.flip()
    }
  };

  _getTargetRenderStateFromFlippedValue = isFlipped => {
    return {
      frontRotation: isFlipped ? 0.5 : 0,
      backRotation: isFlipped ? 1 : 0.5,
      frontOpacity: isFlipped ? 0 : 1,
      backOpacity: isFlipped ? 1 : 0
    }
  };

  render = () => {
    const rotateProperty = this.props.flipAxis === 'y' ? 'rotateY' : 'rotateX'

    return (
      <View {...this.props}>
        <Animated.View
          pointerEvents={this.state.isFlipped ? 'none' : 'auto'}
          style={[
            styles.flippableView,
            Platform.select({
              android: {
                opacity: this.state.frontOpacity
              }
            }),
            {
              transform: [
                { perspective: this.props.perspective },
                { [rotateProperty]: this.state.frontRotation }
              ]
            }
          ]}
        >
          {this.props.front}
        </Animated.View>
        <Animated.View
          pointerEvents={this.state.isFlipped ? 'auto' : 'none'}
          style={[
            styles.flippableView,
            Platform.select({
              android: {
                opacity: this.state.backOpacity
              }
            }),
            {
              transform: [
                { perspective: this.props.perspective },
                { [rotateProperty]: this.state.backRotation }
              ]
            }
          ]}
        >
          {this.props.back}
        </Animated.View>
      </View>
    )
  };

  flip = () => {
    this.props.onFlip()

    const nextIsFlipped = !this.state.isFlipped

    const {
      frontRotation,
      backRotation,
      frontOpacity,
      backOpacity
    } = this._getTargetRenderStateFromFlippedValue(nextIsFlipped)

    let animations = [
      this._animateValue(
        this.state.frontRotationAnimatedValue,
        frontRotation,
        this.props.flipEasing
      ),
      this._animateValue(
        this.state.backRotationAnimatedValue,
        backRotation,
        this.props.flipEasing
      )
    ]

    if (Platform.OS === 'android') {
      animations = [
        ...animations,
        this._animateOpacity(
          this.state.frontOpacityAnimatedValue,
          frontOpacity,
          this.props.flipEasing,
        ),
        this._animateOpacity(
          this.state.backOpacityAnimatedValue,
          backOpacity,
          this.props.flipEasing
        )
      ]
    }

    setImmediate(() => {
      requestAnimationFrame(() => {
        Animated.parallel(animations).start(k => {
          if (!k.finished) {
            return
          }
          this.setState({ isFlipped: nextIsFlipped })
          this.props.onFlipped(nextIsFlipped)
        })
      })
    })
  };

  _animateValue = (animatedValue, toValue, easing) => {
    return Animated.timing(animatedValue, {
      toValue: toValue,
      duration: this.props.flipDuration,
      easing: easing
    })
  };

  _animateOpacity = (animatedValue, toValue, easing) => {
    return Animated.timing(animatedValue, {
      toValue: toValue,
      duration: 0,
      easing: easing,
      delay: (this.props.flipDuration * .3)
    })
  };
}

const styles = StyleSheet.create({
  flippableView: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden'
  }
})
