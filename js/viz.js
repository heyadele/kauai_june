(function() {
  var clear_dashboard_elements, clear_data_table, clear_previous_page, clear_sliders, current_data_category, left_slider_func, load_page, page_setup, render_page, right_slider_func, set_headline, set_single_slider_in_div, set_slider_in_div, set_up_dashboard_elements, set_up_div, set_up_nav, set_up_sliders;

  window.freq = "q";

  current_data_category = {};

  window.series_to_class = function(series_name) {
    return series_name.replace(".", "_").replace("@", "_").replace("%", "pct").replace(" ", "_");
  };

  window.set_up_svg = function(container) {
    var height, width;
    width = +container.style("width").slice(0, -2);
    height = +container.style("height").slice(0, -2);
    return container.append("svg").attr("id", container.attr("id") + "_svg").attr("height", height).attr("width", width);
  };

  set_up_nav = function() {
    return d3.select("div#nav").selectAll("div.nav_link").data(d3.entries(data_categories)).enter().append("div").attr("class", "nav_link").attr("id", function(d) {
      return d.key.replace(" ", "_");
    }).style("width", function(d) {
      return d.value.width + "px";
    }).text(function(d) {
      return d.value.title;
    }).on("click", function(d) {
      return load_page(d.value, true);
    });
  };

  set_headline = function(text) {
    var current_nav_item;
    d3.select("#headline").text(text);
    d3.select("div#nav").selectAll("div.nav_link").style("background-color", null);
    current_nav_item = text.split(' ').join('_').toLowerCase();
    return d3.select("#" + current_nav_item).style("background-color", "#ecffc7");
  };

  set_slider_in_div = function(div_id, dates, pos1, pos2, slide_func) {
    d3.select("#" + div_id).remove();
    d3.select("#" + div_id.replace("div", "container")).insert("div", "div#buttons").attr("id", div_id).attr("class", "slider");
    $("#" + div_id).noUiSlider({
      start: [pos1, pos2],
      behaviour: "tap-drag",
      range: {
        min: 0,
        max: dates.length - 1
      },
      step: 1,
      connect: true
    });
    $("#" + div_id).on("slide", slide_func);
    return d3.select("#" + div_id).datum(dates);
  };

  set_single_slider_in_div = function(div_id, dates, pos1, pos2, slide_func) {
    d3.select("#" + div_id).remove();
    d3.select("#" + div_id.replace("div", "container")).insert("div", "div#buttons").attr("id", div_id).attr("class", "slider");
    $("#" + div_id).noUiSlider({
      start: dates.length - 2,
      range: {
        min: 5,
        max: dates.length - 2
      },
      step: 1
    });
    $("#" + div_id).on("slide", slide_func);
    return d3.select("#" + div_id).datum(dates);
  };

  set_up_sliders = function(dates) {
    set_slider_in_div("line_chart_slider_div", dates, 0, dates.length - 1, left_slider_func);
    return set_single_slider_in_div("time_slice_slider_div", dates, 0, dates.length - 2, right_slider_func);
  };

  left_slider_func = function(event) {
    window.trim_sparklines(event);
    window.trim_time_series(event);
    return window.update_ytd_column(event);
  };

  right_slider_func = function(event) {
    window.redraw_slice(event);
    return window.slide_table(event);
  };

  set_up_div = function(elem) {
    return d3.select("#charts_area").append("div").attr("class", "dashboard_element").attr("id", elem.id).style("width", elem.width + "px").style("height", elem.height + "px").call(elem.type_function);
  };

  set_up_dashboard_elements = function(elements) {
    var elem, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = elements.length; _i < _len; _i++) {
      elem = elements[_i];
      _results.push(set_up_div(elem));
    }
    return _results;
  };

  page_setup = function() {
    collapse(d3.select("#cat_Construction"));
    collapse(d3.select("#cat_Employment"));
    collapse(d3.select("#cat_General"));
    return collapse(d3.select("#cat_Income"));
  };

  clear_dashboard_elements = function() {
    return d3.selectAll("#charts_area .dashboard_element").remove();
  };

  clear_data_table = function() {
    return d3.selectAll("#series_display .category").remove();
  };

  clear_sliders = function() {
    set_slider_in_div("line_chart_slider_div", dates, 0, dates.length - 1, left_slider_func);
    set_single_slider_in_div("time_slice_slider_div", dates, 0, dates.length - 1, redraw_slice);
    return set_single_slider_in_div("datatable_slider_div", dates, 0, dates.length - 1, slide_table);
  };

  clear_previous_page = function() {
    if ((window.secondary_series != null) && (window.secondary_series.datum != null) && window.mode === 'multi_line') {
      window.remove_secondary_series(window.secondary_series);
    }
    clear_dashboard_elements();
    return clear_data_table();
  };

  render_page = function(page_data, page_slug) {
    var array_length, dashboard_elements, first_series, first_value_index, make_slice, series_group, series_to_pie, _fn, _fn1, _i, _j, _len, _len1, _ref, _ref1;
    clear_previous_page();
    set_up_sliders(page_data.dates[window.freq]);
    make_slice = false;
    window.pied = false;
    _ref = page_data.series_groups;
    _fn = function(series_group) {
      if (series_group.series_list[0].children != null) {
        return make_slice = true;
      }
    };
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      series_group = _ref[_i];
      _fn(series_group);
    }
    if (page_slug === 'major') {
      make_slice = true;
    }
    if (page_slug === 'income' || page_slug === 'county_rev') {
      make_slice = false;
    }
    if (make_slice) {
      d3.select("#time_slice_slider_container").style("float", "left").style("margin-right", 0).style("margin-bottom", 0);
      d3.select("#line_chart_slider_container").style("width", "330px");
      dashboard_elements = [
        {
          id: "line_chart",
          width: 425,
          height: 300,
          type_function: line_chart
        }, {
          id: "pie_chart",
          width: 300,
          height: 300,
          type_function: visitor_pie_chart
        }
      ];
      set_up_dashboard_elements(dashboard_elements);
      create_data_table(page_data);
      set_up_line_chart_paths(d3.selectAll("#series_display .series").data());
      first_series = page_data.series_groups[0].series_list[0];
      window.display_line_and_bar_chart(first_series);
      first_value_index = 0;
      array_length = first_series[window.freq].data.length;
      while (first_value_index < array_length && (first_series[window.freq].data[first_value_index] == null)) {
        first_value_index++;
      }
      console.log(page_data.series_groups[0].series_list[0][window.freq]);
      console.log(first_value_index);
      $("#line_chart_slider_div").val(first_value_index, array_length - 1);
      window.trim_sparklines();
      window.trim_time_series();
      window.update_ytd_column();
      clear_line_and_bar_chart(first_series);
      display_line_and_bar_chart(first_series);
      series_to_pie = [];
      _ref1 = page_data.series_groups;
      _fn1 = function(series_group) {
        var series, _k, _len2, _ref2, _ref3, _results;
        if (page_slug === 'major') {
          _ref2 = series_group.series_list;
          _results = [];
          for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
            series = _ref2[_k];
            if ((_ref3 = series.udaman_name) === 'Y_RCY@KAU' || _ref3 === 'VDAY@KAU' || _ref3 === 'E_NF@KAU') {
              _results.push(series_to_pie.push(series));
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        } else {
          if ((series_group.series_list[0].children != null) && window.pied === false) {
            window.pie_these_series(series_group.series_list[0].children);
            return window.pied = true;
          }
        }
      };
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        series_group = _ref1[_j];
        _fn1(series_group);
      }
      if (page_slug === 'major') {
        window.pied = true;
        return window.pie_these_series(series_to_pie, true);
      }
    } else {
      d3.select("#time_slice_slider_container").style("float", "right").style("margin-right", "20px").style("margin-bottom", "20px");
      d3.select("#line_chart_slider_container").style("width", "648px");
      dashboard_elements = [
        {
          id: "line_chart",
          width: 740,
          height: 300,
          type_function: line_chart
        }
      ];
      set_up_dashboard_elements(dashboard_elements);
      create_data_table(page_data);
      set_up_line_chart_paths(d3.selectAll("#series_display .series").data());
      first_series = page_data.series_groups[0].series_list[0];
      window.display_line_and_bar_chart(first_series);
      first_value_index = 0;
      array_length = first_series[window.freq].data.length;
      while (first_value_index < array_length && (first_series[window.freq].data[first_value_index] == null)) {
        first_value_index++;
      }
      console.log(page_data.series_groups[0].series_list[0][window.freq]);
      console.log(first_value_index);
      $("#line_chart_slider_div").val(first_value_index, array_length - 1);
      window.trim_sparklines();
      window.trim_time_series();
      window.update_ytd_column();
      clear_line_and_bar_chart(first_series);
      return display_line_and_bar_chart(first_series);
    }
  };

  load_page = function(data_category, use_default_freq) {
    var fn_affordability, fn_budget, freq_m, freq_m_pipe, freq_q, freq_q_pipe;
    window.old_freq = window.freq;
    if ((window.secondary_series != null) && (window.secondary_series.datum != null) && window.mode === 'multi_line') {
      window.remove_secondary_series(window.secondary_series);
    }
    if (use_default_freq) {
      window.freq = data_category.default_freq;
      $("#frequency_controls span.selected").removeClass("selected");
      $("#frequency_controls span").addClass("enabled");
      $("#freq_" + window.freq).removeClass("enabled");
      $("#freq_" + window.freq).addClass("selected");
    }
    current_data_category = data_category;
    window.load_page_data(data_category.slug, function(data) {
      set_headline(data_category.title);
      return render_page(data, data_category.slug);
    });
    freq_m = $("#freq_m");
    freq_m_pipe = $("#freq_m_pipe");
    freq_q = $("#freq_q");
    freq_q_pipe = $("#freq_q_pipe");
    if (data_category.title === "Personal Income" || data_category.title === "County Budget" || data_category.title === "Major Indicators") {
      freq_m.removeClass("enabled").addClass("disabled");
      freq_q.removeClass("enabled").addClass("disabled");
      freq_m_pipe.removeClass("enabled").addClass("disabled");
      freq_q_pipe.removeClass("enabled").addClass("disabled");
    } else if (data_category.title === "Construction") {
      freq_m.removeClass("enabled").addClass("disabled");
      freq_m_pipe.removeClass("enabled").addClass("disabled");
      freq_q.removeClass("disabled");
      freq_q_pipe.removeClass("disabled").removeClass("enabled");
    } else {
      freq_m.removeClass("disabled").addClass("enabled");
      freq_q.removeClass("disabled").addClass("enabled");
      freq_m_pipe.removeClass("disabled").removeClass("enabled");
      freq_q_pipe.removeClass("disabled").removeClass("enabled");
    }
    fn_affordability = $("#fn_affordability").addClass("disabled");
    fn_budget = $("#fn_budget").addClass("disabled");
    if (data_category.title === "Construction") {
      fn_affordability.removeClass("disabled");
    } else if (data_category.title === "County Budget") {
      fn_budget.removeClass("disabled");
    } else {
      fn_affordability.addClass("disabled");
      fn_budget.addClass("disabled");
    }
    d3.selectAll("#data_sources").selectAll("div").style("visibility", "hidden").style("height", 0);
    switch (data_category.title) {
      case "Major Indicators":
        return d3.select("#data_source_maj").style("visibility", "visible").style("height", "auto");
      case "Visitor Industry":
        return d3.select("#data_source_vis").style("visibility", "visible").style("height", "auto");
      case "Labor Market":
        return d3.select("#data_source_lab").style("visibility", "visible").style("height", "auto");
      case "Personal Income":
        return d3.select("#data_source_per").style("visibility", "visible").style("height", "auto");
      case "Construction":
        return d3.select("#data_source_con").style("visibility", "visible").style("height", "auto");
      case "County Budget":
        return d3.select("#data_source_bud").style("visibility", "visible").style("height", "auto");
    }
  };

  set_up_nav();

  load_page(data_categories["major indicators"], true);

  $("#frequency_controls span").addClass("enabled");

  $("#freq_a").removeClass("enabled").addClass("selected");

  $("#frequency_controls span").on("click", function() {
    if ($(this).hasClass("enabled")) {
      $("#frequency_controls span.selected").removeClass("selected");
      window.freq = $(this).text().toLowerCase();
      load_page(current_data_category);
      $("#frequency_controls span").addClass("enabled");
      $(this).removeClass("enabled");
      $(this).addClass("selected");
      $("#freq_q_pipe").removeClass("enabled");
      return $("#freq_m_pipe").removeClass("enabled");
    }
  });

  $("#export").on("click", function() {
    return window.location.href = "export_data/" + current_data_category.slug + "_" + window.freq + "_export.csv";
  });

  $("#reset").on("click", function() {
    if ((window.secondary_series != null) && (window.secondary_series.datum != null) && window.mode === 'multi_line') {
      window.remove_secondary_series(window.secondary_series);
    }
    return load_page(current_data_category);
  });

}).call(this);
