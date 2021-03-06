(function() {
  var dates, format_d, prep_group_data, prep_series_data, set_data_for, spark_data, yoy, ytd;

  dates = {
    a: [],
    q: [],
    m: []
  };

  window.data_categories = {
    "major indicators": {
      width: 130,
      slug: "major",
      title: "Major Indicators",
      default_freq: "a"
    },
    "visitor industry": {
      width: 140,
      slug: "vis",
      title: "Visitor Industry",
      default_freq: "q"
    },
    "labor market": {
      width: 100,
      slug: "jobs",
      title: "Labor Market",
      default_freq: "q"
    },
    "personal income": {
      width: 120,
      slug: "income",
      title: "Personal Income",
      default_freq: "a"
    },
    "construction": {
      width: 100,
      slug: "const",
      title: "Construction",
      default_freq: "a"
    },
    "county budget": {
      width: 120,
      slug: "county_rev",
      title: "County Budget",
      default_freq: "a"
    }
  };

  yoy = function(d, i, array, f) {
    var last, offset;
    if (d === null || i === 0) {
      return null;
    }
    offset = {
      a: 1,
      q: 4,
      m: 12
    }[f];
    last = array[i - offset];
    if (last === null) {
      return null;
    } else {
      return (d - last) / last * 100;
    }
  };

  spark_data = function(name, data, scale_factor) {
    if (scale_factor == null) {
      scale_factor = 1;
    }
    return data.map(function(row) {
      if (row[name] === "") {
        return null;
      } else {
        return +row[name] * scale_factor;
      }
    });
  };

  ytd = function(series_data, year) {
    return series_data.map(function(d, i, array) {
      var j, ytd_sum;
      ytd_sum = d;
      j = i - 1;
      while (year[i] === year[j]) {
        ytd_sum = ytd_sum + array[j];
        j = j - 1;
      }
      return ytd_sum;
    });
  };

  set_data_for = function(f, series, data) {
    var discard, last_i, peak, series_data, trough, year, ytd_data;
    series_data = spark_data("" + series.udaman_name + "." + (f.toUpperCase()), data[f], series.scale_factor);
    year = data[f].map(function(d) {
      return d.date.slice(0, 4);
    });
    ytd_data = ytd(series_data, year);
    peak = d3.max(series_data);
    trough = d3.min(series_data);
    last_i = series_data.length - 1;
    while (series_data[last_i] === null && (last_i -= 1)) {
      discard = last_i;
    }
    return series[f] = {
      data: series_data,
      year: year,
      ytd: ytd_data,
      date: data[f].map(function(d) {
        return format_d(d.date, f);
      }),
      ytd_change: ytd_data.map(function(d, i, array) {
        return yoy(d, i, array, f);
      }),
      yoy: series_data.map(function(d, i, array) {
        return yoy(d, i, array, f);
      }),
      peak: peak,
      trough: trough,
      last: series_data[last_i],
      peak_i: series_data.indexOf(peak),
      trough_i: series_data.indexOf(trough),
      last_i: last_i
    };
  };

  prep_series_data = function(series, data) {
    var f, s, _i, _j, _len, _len1, _ref, _ref1, _results;
    _ref = ['a', 'q', 'm'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      f = _ref[_i];
      if (series[f]) {
        set_data_for(f, series, data);
      }
    }
    if ((series.children != null) && series.children.length > 0) {
      _ref1 = series.children;
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        s = _ref1[_j];
        _results.push(prep_series_data(s, data));
      }
      return _results;
    }
  };

  prep_group_data = function(series_group, data) {
    var series, _i, _len, _ref, _results;
    _ref = series_group.series_list;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      series = _ref[_i];
      _results.push(prep_series_data(series, data));
    }
    return _results;
  };

  format_d = function(date, f) {
    var q_map;
    q_map = {
      "01": "1",
      "04": "2",
      "07": "3",
      "10": "4"
    };
    switch (f) {
      case "a":
        return date.slice(0, 4);
      case "q":
        return date.slice(0, 4) + "Q" + q_map[date.slice(5, 7)];
      case "m":
        return date.slice(0, 4) + "M" + date.slice(5, 7);
    }
  };

  window.prepare_all_data = function(meta, data) {
    var f, group, _i, _j, _len, _len1, _ref, _ref1;
    _ref = d3.keys(data);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      f = _ref[_i];
      dates[f] = data[f].map(function(d) {
        return format_d(d.date, f);
      });
    }
    _ref1 = meta.series_groups;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      group = _ref1[_j];
      prep_group_data(group, data);
    }
    meta.dates = dates;
    return meta;
  };

  window.load_page_data = function(page_slug, callback) {
    var data_file_a, data_file_m, data_file_q, meta_file, q;
    meta_file = "data/" + page_slug + "_meta.json";
    data_file_a = "data/" + page_slug + "_a.csv";
    data_file_q = "data/" + page_slug + "_q.csv";
    data_file_m = "data/" + page_slug + "_m.csv";
    q = queue();
    q.defer(d3.json, meta_file);
    q.defer(d3.csv, data_file_a);
    q.defer(d3.csv, data_file_q);
    q.defer(d3.csv, data_file_m);
    return q.awaitAll(function(error, results) {
      var data, meta, prepared_data;
      meta = results[0];
      data = {
        a: results[1],
        q: results[2],
        m: results[3]
      };
      prepared_data = prepare_all_data(meta, data);
      return callback(prepared_data);
    });
  };

}).call(this);
