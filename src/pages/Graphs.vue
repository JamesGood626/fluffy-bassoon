<template>
  <Layout>
    <h1>Graphs</h1>
    <!-- <div>{{ arrestData }}</div> -->
    <button @click="updateData">
      updateData
    </button>
    <div id="graph"></div>
    <div id="map"></div>
  </Layout>
</template>

<script>
import AWS from "aws-sdk";
import Papa from "papaparse";
import * as d3 from "d3-dsv";
import Plotly from "plotly.js";

// Initialize the Amazon Cognito credentials provider
AWS.config.region = "us-east-2"; // Region
// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityCredentials.html
// https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-browser-credentials-cognito.html
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: "us-east-2:0bca6063-76f1-4416-88d0-0fd8f56d24b4",
});

var s3 = new AWS.S3();

// Great Success!
function decodeuint8arr(uint8array) {
  return new TextDecoder("utf-8").decode(uint8array);
}

function parseData(csvString, cols) {
  return d3.csvParse(csvString, function(d) {
    console.log("the d: ", d);
    return cols.reduce((acc, key) => {
      acc[key] = d[key];
      return acc;
    }, {});
    // return {
    //   offense_description: d.offense_description,
    //   arrest_boro: d.arrest_boro,
    //   age_group: d.age_group,
    //   perp_sex: d.perp_sex,
    //   perp_race: d.perp_race,
    //   latitude: d.latitude,
    //   longitude: d.longitude,
    // };
  });
}

// var data = [
//   { perp_race: "black", count: 3840 },
//   { perp_race: "white", count: 1600 },
//   { perp_race: "asian", count: 840 },
// ];

function renderGraph(arrestData) {
  // TODO: implement sort by count
  const xs = arrestData.map((d) => d.perp_race);
  const ys = arrestData.map((d) => d.count);

  var data = [
    {
      x: xs,
      y: ys,
      type: "bar",
    },
  ];

  Plotly.newPlot("graph", data);
}
// end bar chart

// begin map
// TODO: How to add events for interactivity?
Plotly.d3.csv(
  // supply link to the cleaned dataset.
  "https://raw.githubusercontent.com/plotly/datasets/master/2015_06_30_precipitation.csv",
  function(err, rows) {
    function unpack(rows, key) {
      return rows.map(function(row) {
        return row[key];
      });
    }

    var data = [
      {
        type: "scattermapbox",
        text: unpack(rows, "Globvalue"),
        lon: unpack(rows, "Lon"),
        lat: unpack(rows, "Lat"),
        marker: { color: "fuchsia", size: 4 },
      },
    ];

    var layout = {
      dragmode: "zoom",
      mapbox: {
        style: "white-bg",
        layers: [
          {
            sourcetype: "raster",
            source: [
              "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}",
            ],
            below: "traces",
          },
        ],
        center: { lat: 40.73577180300003, lon: -73.715638255 },
        zoom: 14,
      },
      margin: { r: 0, t: 0, b: 0, l: 0 },
    };

    Plotly.newPlot("map", data, layout);
  }
);
// end map

export default {
  metaInfo: {
    title: "About us",
  },
  data: function() {
    return {
      arrestData: [],
    };
  },
  methods: {
    updateData: function() {
      console.log(this);
      this.arrestData = "Success";
    },
  },
  watch: {
    arrestData: function(val) {
      console.log("arrestData watch called: ", val);
      renderGraph(val);
    },
  },
  created: function() {
    var params = {
      Bucket: "arrest-hist",
      Key: "race_group_counts.csv",
    };
    // Required to configure CORS on the bucket
    // before the request will go through successfully:
    // https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/cors.html
    const that = this;
    const result = s3.getObject(params, function(err, data) {
      if (err) console.log(err, err.stack);
      // an error occurred
      // TODO: install papaparse
      else {
        const csvString = decodeuint8arr(data["Body"]);
        console.log(csvString);
        data = parseData(csvString, ["perp_race", "count"]);
        // console.log(data);
        // this.arrestData = data;
        console.log("that inside the callback");
        console.log(that);
        that.arrestData = data;
      } // successful response
    });
  },
  // mounted: function() {
  //   Plotly.newPlot("graph", data);
  // },
  // beforeUpdate: function() {

  //   console.log("updated");
  //   console.log("this: ", this);
  // },
};
</script>
