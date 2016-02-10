/* globals _, cytoscape */
/* jshint camelcase: false */
(function(window, $, _, cytoscape, undefined) {
    'use strict';
    var appContext = $('[data-app-name="hrgrn-app"]');
    window.addEventListener('Agave::ready', function() {
        var Agave = window.Agave;

        var errorMessage = function errorMessage(message) {
            return '<div class="alert alert-danger fade in" role="alert">' +
                   '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
                   '<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span><span class="sr-only">Error:</span> ' +
                   message + '</div>';
        };

        var warningMessage = function warningMessage(message) {
            return '<div class="alert alert-warning fade in" role="alert">' +
                   '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
                   '<span class="glyphicon glyphicon-warning-sign" aria-hidden="true"></span><span class="sr-only">Warning:</span> ' +
                   message + '</div>';
        };

        // Displays an error message if the API returns an error
        var showErrorMessage = function showErrorMessage(response) {
            // clear progress bar and spinners
            $('#progress_region', appContext).addClass('hidden');
            console.error('Status: ' + response.obj.status + ' Message: ' + response.obj.message);
            $('#error', appContext).html(errorMessage(response.obj.message));
        };

        var renderCytoscape = function renderCytoscape(elements) {
            $('#cy_pane').removeClass('hidden');
            $('#cy_pane').cytoscape({
                minZoom: 6,
                maxZoom: 30,
                wheelSensitivity: 0.1,
                motionBlur: false,
                layout: {
                    name: 'concentric',
                    fit: true,
                    avoidOverlap: false,
                    concentric: function(){ return this.data('level'); },
                    levelWidth: function(){ return 1; },
                    padding: 30,
                },
                style: cytoscape.stylesheet()
                .selector('node')
                    .css({
                        'content': 'data(label)',
                        'text-valign': 'center',
                        'font-family': 'monospace',
                        'width': function(ele){ return 4*ele.data('zoom'); },
                        'height': function(ele){ return 4*ele.data('zoom'); },
                        'border-width': 0.2,
                        'font-size': 1.8,
                        'shape': 'data(shape)',
                        'background-color': 'data(background_color)',
                        'border-color': 'data(border_color)',
                        'color': 'data(color)',
                    })
                .selector('edge')
                    .css({
                        'width': 0.2,
                        'line-color': 'data(line_color)',
                        'line-style': 'data(line_style)',
                        //'target-arrow-shape': 'data(target_arrow_shape)',
                        'target-arrow-color': 'data(target_arrow_color)',
                    })
                .selector('node:selected')
                    .css({
                        'background-color': '#fbd24d'
                    })
                .selector('edge:selected')
                    .css({
                        'width': 0.6
                    }),
                elements: elements,
                // bind functions to various events - notably, the mouseover tooltips
                ready: function() {
                    var cy = this;

                    cy.elements().selectify();

                    //on mouseover/mouseout, display and hide the appropriate type of mouseover (by calling the makeMouseover()/unmakeMouseover() functions)
                    cy.on('mouseover', '*', function( e ) {
                        var tip = $('#cy_tooltip');
                        var parentOffset = $('#cy_wrapper').offset();
                        var relX = e.originalEvent.pageX - parentOffset.left;
                        var relY = e.originalEvent.pageY - parentOffset.top;
                        tip.css({left: relX + 5, top: relY + 5});
                        tip.html(getElementInfo(e.cyTarget));
                        tip.show();
                    });

                    cy.on('mouseout', '*', function() {
                        $('#cy_tooltip').hide();
                    });
                } //end ready function
            }); //end Cytoscape object options
        }; //end render()

        var getElementInfo = function getElementInfo(target) {
            var tips = target.data('tips');
            return tips;
        };

        var showGraphResults = function showGraphResults(json) {
            $('#progress_region', appContext).addClass('hidden');
            if ( ! (json && json.obj) || json.obj.status !== 'success') {
                $('#error', appContext).html(errorMessage('Invalid response from server!'));
                return;
            }

            if (json.obj.result[0]) {
                console.log('JSON: ' + JSON.stringify(json.obj.result[0], null, 2));
                renderCytoscape(json.obj.result[0]);
            } else {
                $('#cy_pane', appContext).html('');
                var search_locus = $('#locus_id', appContext).val();
                $('#error', appContext).html(warningMessage('No results found for locus identifier \'' + search_locus + '\'. Please try again.'));
            }
        };

        if(console){
            console.log('Agave has been initialized, do something in ' + appContext);
            /* Remove this if you don't want to print the example */
        }

        // controls the clear button
        $('#clearButton', appContext).on('click', function () {
            // clear the gene field
            $('#locus_id', appContext).val('');
            // clear the error section
            $('#error', appContext).empty();
            // clear the number of result rows from the tabs
            $('#progress_region', appContext).addClass('hidden');
            // clear the graph
            $('#cy_pane', appContext).addClass('hidden');
            // select the about tab
            $('a[href="#about"]', appContext).tab('show');
        });

        // search form
        $('#locus_search', appContext).submit(function (event) {
            event.preventDefault();

            // Reset error div
            $('#error', appContext).empty();

            $('a[href="#graph"]', appContext).tab('show');

            $('#cy_pane', appContext).addClass('hidden');

            var query = {
                'locus': this.locus_id.value,
                'pathalg': 'allSimplePaths',
                'steps': '2',
                'showValidatedEdge': 'true',
                'showPredictedEdge': 'true',
                'proteinModification': 'true',
                'showproteinModificationPredicted': 'false',
                'ppiInteraction': 'true',
                'showppiInteractionPredicted': 'false',
                'cpi': 'true',
                'showcpiPredicted': 'false',
                'geneExpressionRegulation': 'true',
                'showgeneExpressionRegulationPredicted': 'false',
                'srnaRegulation': 'true',
                'showsrnaRegulationPredicted': 'true',
                'transportedMolecule': 'true',
                'showtransportedMoleculePredicted': 'false',
                'composition': 'true',
                'showcompositionPredicted': 'true',
                'coexpressedGenePair': 'false',
                'showcoexpressedGenePairPredicted': 'true',
                'chemReaction': 'true',
                'showchemReactionPredicted': 'false',
                'coexpValueCutoff': '0.8',
                'cutoffNodeRelationships': '100'
            };

            // start progress bar
            $('#progress_region', appContext).removeClass('hidden');
            Agave.api.adama.search({
                'namespace': 'hrgrn',
                'service': 'hrgrn_node_details_by_locus_v0.9',
                'queryParams': query
            }, showGraphResults, showErrorMessage);

        });
    });
})(window, jQuery, _, cytoscape);
