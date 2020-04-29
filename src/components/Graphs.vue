<template>
  <Layout>
    <h1>Graphs</h1>
    <div id="race-group"></div>
    <div id="age-group"></div>
    <div id="offense-desc-group"></div>
    <div id="race-offense-group"></div>
    <div id="map"></div>
  </Layout>
</template>

<script>
const offenses = [
  "MISCELLANEOUS PENAL LAW",
  "OTHER OFFENSES RELATED TO THEFT",
  "OTHER STATE LAWS",
  "DANGEROUS DRUGS",
  "OFFENSES INVOLVING FRAUD",
  "INTOXICATED/IMPAIRED DRIVING",
  "INTOXICATED & IMPAIRED DRIVING",
  "CRIMINAL MISCHIEF & RELATED OFFENSES",
  "ASSAULT 3 & RELATED OFFENSES",
  "VEHICLE AND TRAFFIC LAWS",
  "OFFENSES AGAINST PUBLIC ADMINISTRATION",
  "OTHER TRAFFIC INFRACTION",
  "SEX CRIMES",
  "CRIMINAL TRESPASS",
  "BURGLAR'S TOOLS",
  "OTHER STATE LAWS (NON PENAL LAW)",
  "ENDAN WELFARE INCOMP",
  "FRAUDS",
  "OFFENSES AGAINST THE PERSON",
  "POSSESSION OF STOLEN PROPERTY 5",
  "OFFENSES AGAINST PUBLIC SAFETY",
  "ADMINISTRATIVE CODE",
  "GRAND LARCENY OF MOTOR VEHICLE",
  "OFF. AGNST PUB ORD SENSBLTY & RGHTS TO PRIV",
  "POSSESSION OF STOLEN PROPERTY",
  "FORCIBLE TOUCHING",
  "F.C.A. P.I.N.O.S.",
  "MURDER & NON-NEGL. MANSLAUGHTER",
  "FORGERY",
  "PROSTITUTION & RELATED OFFENSES",
  "GRAND LARCENY",
  "ANTICIPATORY OFFENSES",
  "FRAUDULENT ACCOSTING",
  "THEFT-FRAUD",
  "ADMINISTRATIVE CODES",
  "ROBBERY",
  "KIDNAPPING & RELATED OFFENSES",
  "PARKING OFFENSES",
  "MOVING INFRACTIONS",
  "LOITERING",
  "NEW YORK CITY HEALTH CODE",
  "OFFENSES RELATED TO CHILDREN",
  "DANGEROUS WEAPONS",
  "DISRUPTION OF A RELIGIOUS SERVICE",
  "OTHER STATE LAWS (NON PENAL LA",
  "NYS LAWS-UNCLASSIFIED FELONY",
  "PETIT LARCENY",
  "OFF. AGNST PUB ORD SENSBLTY &",
  "MURDER & NON-NEGL. MANSLAUGHTE",
  "CRIMINAL MISCHIEF & RELATED OF",
  "OFFENSES AGAINST PUBLIC ADMINI",
];

const graphTitles = {
  "race-group": "Arrest Counts by Perp Race",
  "age-group": "Arrest Counts by Age Group",
  "offense-desc-group": "Arrest Counts by Offense",
  "race-offense-group": "Arrest Counts grouped by Offense and Race",
};

function configureAWSCredentials(aws) {
  // Initialize the Amazon Cognito credentials provider
  aws.config.region = "us-east-2"; // Region
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityCredentials.html
  // https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-browser-credentials-cognito.html
  aws.config.credentials = new aws.CognitoIdentityCredentials({
    IdentityPoolId: "us-east-2:0bca6063-76f1-4416-88d0-0fd8f56d24b4",
  });
}

function fetchCSV($, that, key, file, columns) {
  var s3 = new $.aws.S3();

  var params = {
    Bucket: "arrest-hist",
    Key: file,
  };
  // Required to configure CORS on the bucket
  // before the request will go through successfully:
  // https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/cors.html

  const result = s3.getObject(params, function(err, data) {
    if (err) console.log(err, err.stack);
    // an error occurred
    else {
      const csvString = decodeuint8arr(data["Body"]);
      data = parseData($.d3, csvString, columns);
      that[key] = data;
    } // successful response
  });
}

// Great Success!
function decodeuint8arr(uint8array) {
  return new TextDecoder("utf-8").decode(uint8array);
}

function parseData(d3, csvString, cols) {
  return d3.csvParse(csvString, function(d) {
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

function renderBarChart(plotly, data, htmlId, [xKey, yKey]) {
  const xs = data.map((d) => d[xKey]);
  const ys = data.map((d) => d[yKey]);

  const chartData = [
    {
      x: xs,
      y: ys,
      type: "bar",
    },
  ];

  var layout = {
    title: {
      text: graphTitles[htmlId],
      y: 0.85,
    },
  };

  plotly.newPlot(htmlId, chartData, layout);
}

// https://plotly.com/javascript/bar-charts/#stacked-bar-chart
function renderStackedBarChart(plotly, data, htmlId, [xKey, yKey]) {
  const traces = data.reduce((acc, curr) => {
    let obj = {
      x: [],
      y: [],
      name: "",
      type: "bar",
    };
    Object.keys(curr).map((key) => {
      if (key === "perp_race") {
        obj.name = curr[key];
      }
      // The offense
      obj.x.push(key);
      // The count
      obj.y.push(curr[key]);
    });
    acc.push(obj);
    console.log("acc: ", acc);
    return acc;
  }, []);
  // for offence race group:
  // [
  //   {
  //     "perp_race": "white",
  //     "Dangerous Drugs": 292931,
  //     // etc... for the rest of the offenses
  //   }
  // ]
  // So a trace will look like:
  const trace1 = {
    x: ["Dangerous Drugs"],
    y: [292931],
    name: "White",
    type: "bar",
  };

  const trace2 = {
    x: ["Dangerous Bananas"],
    y: [292931],
    name: "White",
    type: "bar",
  };
  console.log("data in render Stacked: ", data);

  var data = [trace1, trace2];

  var layout = { barmode: "stack" };

  console.log(traces);

  plotly.newPlot("race-offense-group", traces, layout);
}

// begin map
// TODO: How to add events for interactivity?
function renderMap(plotly) {
  plotly.d3.csv(
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

      plotly.newPlot("map", data, layout);
    }
  );
}
// end map

export default {
  metaInfo: {
    title: "About us",
  },
  data: function() {
    return {
      arrestRaceGroupCountData: [],
      arrestAgeGroupCountData: [],
      arrestOffenseDescCountData: [],
      arrestRaceOffenseData: [],
    };
  },
  watch: {
    arrestRaceGroupCountData: function(val) {
      renderBarChart(this.$Plotly, val, "race-group", ["perp_race", "count"]);
    },
    arrestAgeGroupCountData: function(val) {
      renderBarChart(this.$Plotly, val, "age-group", ["age_group", "count"]);
    },
    arrestOffenseDescCountData: function(val) {
      renderBarChart(this.$Plotly, val, "offense-desc-group", [
        "offense_description",
        "count",
      ]);
    },
    arrestRaceOffenseData: function(val) {
      renderStackedBarChart(this.$Plotly, val, "race-offense-group", [
        "perp_race",
        ...offenses,
      ]);
    },
  },
  created: function() {
    const that = this;
    const $ = {
      aws: this.$AWS,
      d3: this.$d3,
    };
    configureAWSCredentials(this.$AWS);
    fetchCSV($, that, "arrestRaceGroupCountData", "race_group_counts.csv", [
      "perp_race",
      "count",
    ]);
    fetchCSV($, that, "arrestAgeGroupCountData", "age_group_counts.csv", [
      "age_group",
      "count",
    ]);
    fetchCSV(
      $,
      that,
      "arrestOffenseDescCountData",
      "offense_desc_group_counts.csv",
      ["offense_description", "count"]
    );
    fetchCSV(
      $,
      that,
      "arrestRaceOffenseData",
      "race_offense_group_counts.csv",
      ["perp_race", ...offenses]
    );
  },
};
</script>
