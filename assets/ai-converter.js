jQuery( window ).on( 'elementor:init', function() {

    elementor.hooks.addFilter( 'elements/container/contextMenuGroups', function( groups, view ) {
        const converterGroup = {
            name: 'ai-converter-container',
            actions: [
                {
                    name: 'optimize_container',
                    title: 'Convert to V4',
                    icon: 'eicon-ai',
                    callback: function() {
                        const container = {
                            elType: view.model.get('elType'),
                            settings: view.model.get('settings')?.toJSON({ remove: 'default' }) || {},
                        };

						// Simulate AI conversion process

						// V4 Response from your AI conversion
						const response = {
							"elType": "e-flexbox",
							"settings": {
								"classes": {
									"$$type": "classes",
									"value": [
										"e-21a0e6f-095dbb2"
									]
								}
							},
							"elements": [],
							"isInner": false,
							"styles": {
								"e-21a0e6f-095dbb2": {
									"id": "e-21a0e6f-095dbb2",
									"label": "local",
									"type": "class",
									"variants": [
										{
											"meta": {
												"breakpoint": "desktop",
												"state": null
											},
											"props": {
												"background": {
													"$$type": "background",
													"value": {
														"color": {
															"$$type": "color",
															"value": "#ff0000"
														}
													}
												}
											}
										}
									]
								}
							}
						};

						const newContainer = $e.run( 'document/elements/create', {
							model: { ...response },
							container: view.container,
							options: {
								at: 0,
								edit: false,
							},
						} );

                    }
                }
            ]
        };

        groups.push(converterGroup);
        return groups;
    } );
} );

