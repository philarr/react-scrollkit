"use strict";

var React = require('react');
var Helpers = require('../mixins/Helpers');

var Reveal = React.createClass({
  render: function () {
  	console.log(this.props);
    return React.DOM.div(this.props, this.props.children);
  }
});

module.exports = Helpers.Reveal(Reveal);