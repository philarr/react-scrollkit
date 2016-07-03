"use strict";

var React = require('react');
var ReactDOM = require('react-dom');

var animateScroll = require('./animate-scroll');
var scrollSpy = require('./scroll-spy');
var defaultScroller = require('./scroller');

var Helpers = {

  Scroll: function (Component, customScroller) {

  	var scroller = customScroller || defaultScroller;

    return React.createClass({
      propTypes: {
        to: React.PropTypes.string.isRequired,
        offset: React.PropTypes.number,
        delay: React.PropTypes.number,
        onClick: React.PropTypes.func,
        duration: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.func])
      },

      getDefaultProps: function() {
        return {offset: 0};
      },

      scrollTo : function(to, props) {
      	scroller.scrollTo(to, props);
      },

      handleClick: function(event) {

        /* give the posibility to override onClick */
        if(this.props.onClick) this.props.onClick(event);

        /* dont bubble the navigation */
        if (event.stopPropagation) event.stopPropagation();
        if (event.preventDefault) event.preventDefault();

        /* do the magic! */
        this.scrollTo(this.props.to, this.props);

      },

      stateHandler: function() {
        if(scroller.getActiveLink() != this.props.to) {
            this.setState({ active : false });
        }
      },

      spyHandler: function(y) {
      	var to = this.props.to;
        var element = scroller.get(to);
	    	if (!element) return;

        var coords = element.getBoundingClientRect();
        var offsetY = y - this.props.offset;
        var isInside = (offsetY >= (coords.top + y) && offsetY <=  (coords.top + y) + coords.height - 1);
        var isOutside = (offsetY < (coords.top + y) || offsetY >  (coords.top + y) + coords.height - 1);
        var activeLink = scroller.getActiveLink();

        if (isOutside && activeLink === to) {
          scroller.setActiveLink(void 0);
          this.setState({ active : false });

        } else if (isInside && activeLink != to) {
          scroller.setActiveLink(to);
          this.setState({ active : true });

          if(this.props.onSetActive) {
            this.props.onSetActive(to);
          }
          scrollSpy.updateStates();
        }
      },

      componentDidMount: function() {
        if (this.props.spy) {
          scrollSpy.mount(this.stateHandler, this.spyHandler);
          //run handler once when component mount to calculate this.state.
          this.stateHandler();
          this.spyHandler();
        }
      },

      componentWillUnmount: function() {
        scrollSpy.unmount(this.stateHandler, this.spyHandler);
      },

      render: function() {
        var className = (this.state && this.state.active) ? ((this.props.className || "") + " " + (this.props.activeClass || "active")).trim() : this.props.className;
 

        return React.createElement(Component,  { className: className });
      }
    });
  },


 

  Reveal: function (Component, customScroller) {
    var scroller = customScroller || defaultScroller;

    return React.createClass({
      propTypes: {
        name: React.PropTypes.string.isRequired,
        offset: React.PropTypes.number,
        delay: React.PropTypes.number,
        once: React.PropTypes.bool,
        lazy: React.PropTypes.bool,
      },
    
      getDefaultProps: function() {
        return { 
          offset: 0,
          once: true,
          lazy: false,
          delay: 0
         };
      },

      getInitialState: function() {
    	return { active: false };
 	    },
 
      inViewport: function(el, o) {
        var rect = el.getBoundingClientRect();
        if ((rect.top + o) <= (window.innerHeight || document.documentElement.clientHeight)) return true;
        return false;
      },

      spyHandler: function(y) {
        //use scroll-spy but instead of 'to', target itself
        var domNode = ReactDOM.findDOMNode(this);
        var offset = this.props.offset;

        /* if element is in viewport, set class 'active' or specified from 'activeClass' */
        if (this.inViewport(domNode, offset) && !this.state.active) {
            this.setState({ active : true });
            /* remove from stack if animated once or is lazy loaded */
            if (this.props.once || this.props.lazy) {
              /* Unmount scroll event, no longer need to check scroll position for reveal trigger */
              scrollSpy.unmount(null, this.spyHandler);
              /* Must leave for scrollTo functions to find element
               defaultScroller.unregister(this.props.name);
              */
            }
        }
        /* Element moved out of viewport, remove activeClass and set state to false */
        else if (!this.inViewport(domNode, offset) && this.state.active) {
            this.setState({ active : false });
 
        }
      },
      componentDidMount: function() {
	        var domNode = ReactDOM.findDOMNode(this);
	        defaultScroller.register(this.props.name, domNode);
          scrollSpy.mount(null, this.spyHandler);
          //run handler once on mount to calculate state
          this.spyHandler();
     
      },
      componentWillUnmount: function() {
     	    scrollSpy.unmount(null, this.spyHandler);
     	    defaultScroller.unregister(this.props.name);
      },
      render: function() {
 
        var className = (this.state && this.state.active) ? ((this.props.className || "") + " " + (this.props.activeClass || "active")).trim() : this.props.className;
 

        /* Lazy load => empty div if not in view, render child when it is */
        if (this.props.lazy && !this.state.active) {
          return React.createElement('div');
        }
        return React.createElement(Component, { className: className });

      }
    });
  },



  Element: function(Component) {
    return React.createClass({
      propTypes: {
        name: React.PropTypes.string.isRequired
      },

      componentDidMount: function() {
        var domNode = ReactDOM.findDOMNode(this);
        defaultScroller.register(this.props.name, domNode);
      },
      componentWillUnmount: function() {
        defaultScroller.unregister(this.props.name);
      },
      render: function() {
        return React.createElement(Component, this.props);
      }
    });
  }
};

module.exports = Helpers;
