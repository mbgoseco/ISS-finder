'use strict';

var looper;
var degrees = 0;

function rotateAnimation(el, speed) {
  var earth = document.getElementById(img1);
  if (navigator.userAgent.match('chrome')) {
    earth.style.webkitTransform = 'rotate( ' + degrees + ' deg)';
  }
  looper = setTimeout('rotateAnimation(\''+el+'\','+speed+')',speed);
  degrees++;
  if(degrees > 359) {
    degrees = 1;
  }
  return rotateAnimation('img1',50);
}