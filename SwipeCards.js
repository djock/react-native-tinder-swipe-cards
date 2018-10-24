/* Gratefully copied from https://github.com/brentvatne/react-native-animated-demo-tinder */
'use strict';

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
    StyleSheet,
    Text,
    View,
    Animated,
    PanResponder,
    Image,
    Dimensions
} from 'react-native';

import clamp from 'clamp';

import Defaults from './Defaults.js';

var HORIZONTAL_TRESHOLD = 100;
var VERTICAL_TRESHOLD = 5000;
const WindowHeight  = Dimensions.get('window').height;

// Base Styles. Use props to override these values
var styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF'
    },
    yup: {
        height: Dimensions.get('window').height,
        backgroundColor: '#ff6363',
        width: 5,
        position: 'absolute',
        padding: 0,
        bottom: 0,
        right: 0
    },
    nope: {
        height: Dimensions.get('window').height,
        alignSelf: "flex-end",
        backgroundColor: 'black',
        width: 5,
        position: 'absolute',
        padding: 0,
        bottom: 0,
        left: 0
    }
});

class SwipeCards extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pan: new Animated.ValueXY(),
      enter: new Animated.Value(1),
      card: this.props.cards ? this.props.cards[0] : null,
    }
  }

  _goToNextCard() {
    let currentCardIdx = this.props.cards.indexOf(this.state.card);
    let newIdx = currentCardIdx + 1;

    // Checks to see if last card.
    // If props.loop=true, will start again from the first card.
    let card = newIdx > this.props.cards.length - 1
      ? this.props.loop ? this.props.cards[0] : null
      : this.props.cards[newIdx];

    this.setState({
      card: card
    });
  }

  componentDidMount() {
    this._animateEntrance();
  }

  _animateEntrance() {
    Animated.spring(
      this.state.enter,
      { toValue: 1, friction: this.props.frictionValue }
    ).start();
  }

  _animateExit(velocity, vy) {
    Animated.decay(this.state.pan, {
      velocity: {x:velocity, y: vy},
      deceleration: 0.6
    }).start(this._resetState.bind(this))
  }

  _returnToCenter() {
    Animated.spring(this.state.pan, {
      toValue: {x: 0, y: 0},
      friction: 4
    }).start()
  }

  componentWillReceiveProps(nextProps){
    if(nextProps.cards && nextProps.cards.length > 0){
      this.setState({
        card: nextProps.cards[0]
      })
    }
  }

  componentWillMount() {
    this._panResponder = PanResponder.create({
      onMoveShouldSetResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        return gestureState.dx != 0 && gestureState.dy != 0;
      },

      onPanResponderGrant: (e, gestureState) => {
        this.state.pan.setOffset({x: this.state.pan.x._value, y: this.state.pan.y._value});
        this.state.pan.setValue({x: 0, y: 0});
      },

      onPanResponderMove: Animated.event([
        null, {dx: this.state.pan.x, dy: this.state.pan.y},
      ]),

      onPanResponderRelease: (e, {vx, vy}) => {
        this.state.pan.flattenOffset();
        var velocity;

        if (vx >= 0) {
            velocity = clamp(vx, 5, 8);
        } else if (vx < 0) {
            velocity = clamp(vx * -1, 5, 8) * -1;
        }

        if (Math.abs(this.state.pan.x._value) > HORIZONTAL_TRESHOLD) {

          this.state.pan.x._value > 0
            ? this.props.handleRight(this.state.card)
            : this.props.handleLeft(this.state.card)

          this.props.cardRemoved
            ? this.props.cardRemoved(this.props.cards.indexOf(this.state.card))
            : null

          this._animateExit(velocity, vy);

        } else if(Math.abs(this.state.pan.y._value) > VERTICAL_TRESHOLD) {

          this.state.pan.y._value > 0
            ? this.props.handleDown(this.state.card)
            : this.props.handleUp(this.state.card)

          this.props.cardRemoved
            ? this.props.cardRemoved(this.props.cards.indexOf(this.state.card))
            : null

          this._animateExit(velocity, vy);

        } else {
          this._returnToCenter();
        }
      }
    })
  }

  async _resetState() {
    await this.state.enter.setValue(0.7);
    this.state.pan.setValue({x: 0, y: 0});
    
    this._goToNextCard();
    this._animateEntrance();
  }

  renderNoMoreCards() {
    if (this.props.renderNoMoreCards)
      return this.props.renderNoMoreCards();

    return (
      <Defaults.NoMoreCards />
    )
  }

  renderCard(cardData) {
    return this.props.renderCard(cardData)
  }

  render() {
    let { pan, enter, } = this.state;

    let [translateX, translateY] = [pan.x, pan.y];

    let rotate = this.props.rotation ? pan.x.interpolate({inputRange: [-200, 0, 200], outputRange: ["-30deg", "0deg", "30deg"]}) : '0deg';
    let opacity = pan.x.interpolate({inputRange: [-200, 0, 200], outputRange: [0.5, 1, 0.5]});
    let scale = enter;

    let animatedCardstyles = {transform: [{translateX}, {translateY}, {rotate}, {scale}], opacity};

    let yupOpacity = pan.x.interpolate({inputRange: [0, 100], outputRange: [0, 1]});
    let animatedYupStyles = {opacity: yupOpacity}

    let nopeOpacity = pan.x.interpolate({inputRange: [-100, 0], outputRange: [1, 0]});
    let animatedNopeStyles = {opacity: nopeOpacity}

        return (
            <View style={this.props.containerStyle}>
                { this.state.card
                    ? (
                    <Animated.View style={[this.props.cardStyle, animatedCardstyles]} {...this._panResponder.panHandlers}>
                        {this.renderCard(this.state.card)}
                    </Animated.View>
                )
                    : this.renderNoMoreCards() }


                { this.props.renderNope
                  ? this.props.renderNope(pan)
                  : (
                      this.props.showNope
                      ? (
                        <Animated.View style={[this.props.nopeStyle, animatedNopeStyles]}>
                            {this.props.noView}
                        </Animated.View>
                        )
                      : null
                    )
                }

                { this.props.renderYup
                  ? this.props.renderYup(pan)
                  : (
                      this.props.showYup
                      ? (
                        <Animated.View style={[this.props.yupStyle, animatedYupStyles]}>
                            {this.props.yupView}
                        </Animated.View>
                      )
                      : null
                    )
                }

            </View>
    );
  }
}

SwipeCards.propTypes = {
    cards: PropTypes.array,
    renderCards: PropTypes.func,
    loop: PropTypes.bool,
    renderNoMoreCards: PropTypes.func,
    showYup: PropTypes.bool,
    showNope: PropTypes.bool,
    handleRight: PropTypes.func,
    handleLeft: PropTypes.func,
    handleUp: PropTypes.func,
    handleDown: PropTypes.func,
    yupView: PropTypes.element,
    yupText: PropTypes.string,
    noView: PropTypes.element,
    noText: PropTypes.string,
    containerStyle: View.propTypes.style,
    cardStyle: View.propTypes.style,
    yupStyle: View.propTypes.style,
    yupTextStyle: Text.propTypes.style,
    nopeStyle: View.propTypes.style,
    nopeTextStyle: Text.propTypes.style,
    frictionValue: PropTypes.number,
    rotation: PropTypes.bool,
    dragY: PropTypes.bool
};

SwipeCards.defaultProps = {
    loop: false,
    showYup: true,
    showNope: true,
    containerStyle: styles.container,
    yupStyle: styles.yup,
    yupTextStyle: styles.yupText,
    nopeStyle: styles.nope,
    nopeTextStyle: styles.nopeText,
    frictionValue: 10,
    rotation: true,
    dragY: true
};

export default SwipeCards
