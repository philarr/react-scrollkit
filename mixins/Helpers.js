"use strict";

var React = require('react');
var ReactDOM = require('react-dom');

var animateScroll = require('./animate-scroll');
var scrollSpy = require('./scroll-spy');
var defaultScroller = require('./scroller');



function inViewport(el, o) {
  var rect = el.getBoundingClientRect();
  return ((rect.top + o) <= (window.innerHeight || document.documentElement.clientHeight));
}


var Helpers = {

  Scroll: function (Component, customScroller) {

  	var scroller = customScroller || defaultScroller;
    return React.createClass({
      propTypes: {
        to: React.PropTypes.string.isRequired,
        offset: React.PropTypes.number,
        delay: React.PropTypes.number,
        onClick: React.PropTypes.func,
        duration: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.func]),
      },
      getInitialState: function() {
      return { active: false };
      },
      getDefaultProps: function() {
        return { offset: 0 };
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
        /* Currently isInside is true when top edge reached top of viewport && bottom edge has not left viewport */
        var isInside = (offsetY >= (coords.top + y - 1) && offsetY <=  (coords.top + y) + coords.height - 1);
        var isOutside = (offsetY < (coords.top + y - 1) || offsetY >  (coords.top + y) + coords.height - 1);
        var activeLink = scroller.getActiveLink();

        if (isOutside && activeLink === to) {
          scroller.setActiveLink(void 0);
          this.setState({ active : false });
        } else if (isInside && activeLink != to) {
          scroller.setActiveLink(to);
          this.setState({ active : true });
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
        return React.createElement(Component,  
          { 
            className: className, 
            children: this.props.children, 
            onClick: this.handleClick,
            id: this.props.id,
            style: this.props.style 
          });
      }
    });
  },

  Reveal: function (Component, customScroller) {
    var scroller = customScroller || defaultScroller;

    return React.createClass({
      propTypes: {
        wrapper: React.PropTypes.string,
        name: React.PropTypes.string.isRequired,
        offset: React.PropTypes.number,
        delay: React.PropTypes.number,
        once: React.PropTypes.bool,
        lazy: React.PropTypes.bool,
      },
      getDefaultProps: function() {
        return { 
          wrapper: 'div',
          offset: 0,
          once: true,
          lazy: false,
          delay: 0
         };
      },
      getInitialState: function() {
    	return { active: false };
 	    },
      spyHandler: function(y) {
        //use scroll-spy but instead of 'to', target itself
        var domNode = ReactDOM.findDOMNode(this);
        var offset = this.props.offset;
        /* if element is in viewport, set class 'active' or specified from 'activeClass' */
        if (inViewport(domNode, offset) && !this.state.active) {
 
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
        else if (!inViewport(domNode, offset) && this.state.active) {
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
        var  children = this.props.children;
        if (this.props.lazy && !this.state.active) {
          children = React.createElement('div');
        }
        return React.createElement(this.props.wrapper,  { 
          className: className,
          id: this.props.id,
          style: this.props.style 
        }, children);

      }
    });
  },


  /*
  * Reveal for images that wants to be lazy and preloaded,
  * also hoists React SSR by forcing file-loader to only resolve
  * image URLS on client. Behaviour may have its benefit
  * (no need to implement isomorphic tools) but images will not show
  * if SSR for images is intended.
  */

  LazyImage: function() {
    return React.createClass({
      propTypes: {
        src: React.PropTypes.string.isRequired,
        offset: React.PropTypes.number,
        wrapper: React.PropTypes.string,
        wrapperClass: React.PropTypes.object,
      },
      getDefaultProps: function() {
        return { 
          offset: 0,
         };
      },
      getInitialState: function() {
        return { 
          loaded: false,
          active: false,
          error: false
         }
      },
      loadImage: function(url) {
        return new Promise(function(resolve, reject) {
            var img = new Image();
            img.onload = function() {
              setTimeout(resolve, 50);
            }
            img.onerror = reject;
            img.src = url;
        });
      },
      onerror: function() {
        console.log(this.props.src + ' not found!');
      },
      spyHandler: function() {

        var domNode = ReactDOM.findDOMNode(this);
 

        if (inViewport(domNode, this.props.offset) && !this.state.active) {
 
            this.setState({ active : true });
            scrollSpy.unmount(null, this.spyHandler);

            this.loadImage(this.props.src).then(function() {
              this.setState({loaded: true});
            }.bind(this));

            
        }
      },
      componentDidMount: function() {
 
          scrollSpy.mount(null, this.spyHandler);
          this.spyHandler();
      },
      componentWillUnmount: function() {
          scrollSpy.unmount(null, this.spyHandler);
      },
      render: function() {
        var component;
        var className = (this.state.active && this.state.loaded) ? ((this.props.className || "") + " " + (this.props.activeClass || "active")).trim() : this.props.className;

        if (this.state.active) {

          component = React.createElement('img', { 
                  src: this.props.src,
                  className: className,
                  alt: this.props.alt,
                  title: this.props.title,
                  style: {
                    visibility: this.state.loaded ? 'visible' : 'hidden'
                  },
                  id: this.props.id,
                });
        }
        else {
          component = React.createElement('span');
        }

        if (this.props.wrapper) {
           return React.createElement(wrapper, { className: this.props.wrapperClass }, component);
        }

        return component;
      }
    })
  },



 /* 
  Dedicated Spy components to react to another element's position
 */
 


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
       
        return React.createElement(Component, { 
          className: this.props.className, 
          children: this.props.children ,
          id: this.props.id,
          style: this.props.style 
        });
      }
    });
  }
};

module.exports = Helpers;
