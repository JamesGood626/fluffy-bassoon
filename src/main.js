// This is the main.js file. Import global CSS and scripts here.
// The Client API can be used here. Learn more: gridsome.org/docs/client-api

import DefaultLayout from "~/layouts/Default.vue";
import AWS from "aws-sdk";
import * as d3 from "d3-dsv";
import Plotly from "plotly.js";

export default function(Vue, { router, head, isClient }) {
  // Set default layout as a global component
  Vue.component("Layout", DefaultLayout);

  // To fix the build error - ReferenceError: document is not defined - occuring
  // from within the Graphs component:
  // https://gridsome.org/docs/assets-scripts/#using-an-external-library-1
  Vue.prototype.$AWS = AWS;
  Vue.prototype.$d3 = d3;
  Vue.prototype.$Plotly = Plotly;
}

import moment from "moment";
