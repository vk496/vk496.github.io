$(document).ready(function() {
        //Diseño responsive
        if ($(window).width() < 480) {
            $("#content").attr('class', "row");
            $("#map").attr("class", "well well-lg");
            $("#bootstrap_lista_units").attr("class", "well");
        } else {
            $("#content").attr('class', "");
            $("#map").attr("class", "well well-lg col-xs-5 col-sm-5 col-md-5 col-lg-5 col-xs-offset-1 col-sm-offset-1 col-md-offset-1 col-lg-offset-1");
            $("#bootstrap_lista_units").attr("class", "well col-xs-5 col-sm-5 col-md-5 col-lg-5");
        }

        /*Creación del mapa*/

        var width = 760;
        var height = 470;

        //Proyección Albers de los datos con ajustes para la Península
        var projection = d3.geo.albers()
            .center([0, 39.23])
            .rotate([3.4, 0])
            .parallels([50, 90])
            .scale(1200 * 2.3)
            .translate([width / 2.5, height / 2]);

        /*Creacion de un path según los ajustes de proyección*/
        var path = d3.geo.path()
            .projection(projection);

        /*Se añade un svg al div que contendrá el mapa*/
        var svg = d3.select("#map")
            .append("svg")
            .append("g")
            .attr("width", width)
            .attr("height", height);

        /*Se añaden una a una las provincias descritas en el json*/
        d3.json("maps/esp-ascii.json", function(error, esp) {
            svg.selectAll(".subunit")
                .data(topojson.feature(esp, esp.objects.subunits).features)
                .enter().append("path")
                .attr("class", function(d) {
                    return "subunit " + d.id;
                })
                .attr("d", path)
                .on("mouseover", provincia_hover)
                .on("click", provincia_click);

            svg.append("path")
                .datum(topojson.mesh(esp, esp.objects.subunits, function(a, b) {
                    return a !== b
                }))
                .attr("d", path)
                .attr("class", "subunit-boundary");
        });

        var projection_canary = d3.geo.albers()
            .center([-6.5, 24])
            .rotate([3.4, 0])
            .parallels([50, 51])
            .scale(1200 * 1.9)
            .translate([width / 2.5, height / 2]);

        var path_canary = d3.geo.path().projection(projection_canary);


        width_canary = $("#map-canarias").width();
        height_canary = $("#map-canarias").height();
        var canarias = d3.select("#map-canarias")
            .append("svg")
            .append("g")
            .attr("width", width_canary)
            .attr("height", height_canary);

        d3.json("maps/canary.json", function(error, esp) {
            canarias.selectAll(".subunit")
                .data(topojson.feature(esp, esp.objects.subunits).features)
                .enter().append("path")
                .attr("class", function(d) {
                    return "subunit " + d.id;
                })
                .attr("d", path_canary)
                .on("mouseover", provincia_hover)
                .on("click", provincia_click);

            canarias.append("path")
                .datum(topojson.mesh(esp, esp.objects.subunits, function(a, b) {
                    return a !== b
                }))
                .attr("d", path)
                .attr("class", "subunit-boundary");
        });

        d3.select(window).on('resize', sizeChange);
        sizeChange();

        function sizeChange() {
            if ($(window).width() < 480) {
                $("#content").attr('class', "row");
                $("#map").attr("class", "well well-lg");
                $("#bootstrap_lista_units").attr("class", "well");
            } else {
                $("#map").attr("class", "well well-lg col-xs-5 col-sm-5 col-md-5 col-lg-5 col-xs-offset-1 col-sm-offset-1 col-md-offset-1 col-lg-offset-1");
                $("#bootstrap_lista_units").attr("class", "well col-xs-5 col-sm-5 col-md-5 col-lg-5");
            }

            d3.select("#map>svg>g").attr("transform", "scale(" + $("#map").width() / 700 + ")");
            $("#map>svg").height($("#map").width() * 0.618);
            $("#map>svg").width($("#map").width());

            d3.select("#map-canarias>svg>g").attr("transform", "scale(" + $("#map-canarias").width() / 200 + ")");
            $("#map-canarias>svg").height($("#map-canarias").width() * 0.518);
            $("#map-canarias>svg").width($("#map-canarias").width());
        }

    function provincia_hover(d) {

        $('.subunit').tipsy({
            gravity: 's',
            html: true,
            title: function() {
                var m = this.__data__;

                return m.id;
            }
        });
    }

    function provincia_click(d) {
        var resultados = [];
        var convenios_filter = [];
        $('#bootstrap_lista_units').html('');

        d3.json("data/uni/unis.json", function(error, unis) {
            var universidades = unis.unis;
            $.each(universidades, function(index, value) {
                if (value.provincia === d.id) {
                    resultados.push(value);
                }
            });
            var universidades_provincia = [];
            if (resultados.length > 0) {
                $.each(resultados, function(index, value) {
                    universidades_provincia.push(resultados[index]);
                    for (var i = universidades.length - 1; i >= 0; i--) {
                        if (resultados[index].convenios.indexOf(universidades[i].siglas) > -1) {
                            convenios_filter.push(universidades[i]);
                        }
                    };
                });
                create_dropdown(universidades_provincia, convenios_filter);
            } else {
                $('#bootstrap_lista_units').html('<p>No se han encontrado resultados</p>');
            }
        });
    }

    function create_dropdown(universidades_provincia, universidades) {
        var dropdown = [];
        $.each(universidades_provincia, function(index, value) {
            /*Los campus siguen  la regla {{universidad}}-{{nombre campus}}, 
             * al eliminar todo lo que se encuentra detras del guión podemos utilizar siempre la misma imagen
             */
            var siglas = value.siglas.replace(/\-.*/g, '');
            var render_convenios;

            $.get('template_universidad_provincia.mst', function(template_universidad_provincia) {
                var render_resultados = Mustache.render(template_universidad_provincia, {
                    nombre: value.nombre,
                    campus: value.campus,
                    centro: value.centro,
                    url: value.url,
                    siglas: value.siglas.replace(/-.*/, ''),
                    tasas1: value.tasas_2014.tasas1,
                    tasas2: value.tasas_2014.tasas2,
                    tasas3: value.tasas_2014.tasas3,
                    tasas4: value.tasas_2014.tasas4,
                    urls: [{
                        "url": value.tasas_2011.url,
                        "fecha": 2011
                    }, {
                        "url": value.tasas_2012.url,
                        "fecha": 2012
                    }, {
                        "url": value.tasas_2013.url,
                        "fecha": 2013
                    }, {
                        "url": value.tasas_2014.url,
                        "fecha": 2014
                    }]
                });

                $('#bootstrap_lista_units').append(render_resultados);
                if (value.tasas_2011 && value.tasas_2012 && value.tasas_2013) {
                    var chart = c3.generate({
                        bindto: "#chart",
                        data: {
                            x: 'x',
                            x_format: '%Y',
                            columns: [
                                ['x', new Date('2011'), new Date('2012'), new Date('2013'), new Date('2014')],
                                ['Primera matrícula', value.tasas_2011.tasas1, value.tasas_2012.tasas1, value.tasas_2013.tasas1, value.tasas_2014.tasas1],
                                ['Segunda matrícula', value.tasas_2011.tasas2, value.tasas_2012.tasas2, value.tasas_2013.tasas2, value.tasas_2014.tasas2],
                                ['Tercera matrícula', value.tasas_2011.tasas3, value.tasas_2012.tasas3, value.tasas_2013.tasas3, value.tasas_2014.tasas3],
                                ['Cuarta matrícula', value.tasas_2011.tasas4, value.tasas_2012.tasas4, value.tasas_2013.tasas4, value.tasas_2014.tasas4],
                                ['Media nacional', 0, 0, 0, 0, 0, 0]
                            ]
                        },
                        axis: {
                            x: {
                                type: 'timeseries',
                                tick: {
                                    //              format : "%m/%d" // https://github.com/mbostock/d3/wiki/Time-Formatting#wiki-format
                                    format: "%Y" // https://github.com/mbostock/d3/wiki/Time-Formatting#wiki-format
                                }
                            }
                        }
                    });
                }

                var panels = $('.user-infos');
                var panelsButton = $('.dropdown-user');
                panels.hide();


                panels = $('.user-infos');
                panelsButton = $('.dropdown-user');
                panels.hide();

                //Se desactivan todos los eventos, dado que en caso contrario origina problemas al añadir y eliminar (se superponen eventos)
                panelsButton.off();
                panelsButton.click(function() {
                    //Se obtiene el atributo data-for
                    var dataFor = $(this).attr('data-for');
                    var idFor = $(dataFor);


                    var currentButton = $(this);
                    idFor.slideToggle(400, function() {

                        if (idFor.is(':visible')) {
                            currentButton.html('<i class="glyphicon glyphicon-chevron-up text-muted"></i>');
                        } else {
                            currentButton.html('<i class="glyphicon glyphicon-chevron-down text-muted"></i>');
                        }
                    })
                });
                $('[data-toggle="tooltip"]').tooltip();
            });

        });
    }
});
