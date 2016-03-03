var sapUshellConfig = {
                services: {
                    SupportTicket: {
                        config: {
                            enabled: false
                        }
                    },
                    EndUserFeedback: {
                        config: {
                            enabled: false
                        }
                    },
                    Container: {
                        adapter: {
                            config: {
                                setUserCallback: "sap.smp.fnMyCallback"
                            }
                        }
                    },
                    NavTargetResolution: {
                        adapter: {
                            config: {
                                applications: applications,
                            }
                        }
                    },
                    LaunchPage: {
                        adapter: {
                            config: {
                                pathToLocalizedContentResources: './messagebundle.properties',
                                groups: [ {
                                    id: "group_0",
                                    title: "CRM",
                                    isPreset: true,
                                    isVisible: true,
                                    isDefault: false,
                                    tiles: tiles
                                } ],
                                catalogs: [
                                ]
                            }
                        }
                    }
                },
                renderers: {
                    fiori2 : {
                        componentData: {
                            config: {
                                "enablePersonalization": false,
                                "enableTagFiltering":false,
                                "enableSearch": false,
                                "enableTilesOpacity": false,
                                "enableHideGroups": false,
                                "enableSetTheme": false,
                                "enableAccessibility": true,
                                "enableSendFeedback": false,
                                "states": {
                                    "app" : {
                                        "stateName" : "app",
                                        "showCurtain" : false,
                                        "headerHiding" : true,
                                        "headerVisible" : true,
                                        "showCatalog" : false,
                                        "showPane" : false,
                                        "headItems" : ["homeBtn"],
                                        "headEndItems" : [],
                                        "search" : "",
                                        "actions" : ["aboutBtn"],
                                        "shellActions": ["aboutBtn"], //when opening an app, take the original actions from here
                                        "floatingActions" : [],
                                        "footer" : []
                                    },
                                    "home" : {
                                        "stateName" : "home",
                                        "showCurtain" : false,
                                        "headerHiding" : false,
                                        "headerVisible" : true,
                                        "showCatalog" : false,
                                        "showPane" : false,
                                        "headItems" : [],
                                        "headEndItems" : [],
                                        "search" : "",
                                        "paneContent" : [],
                                        "actions" : ["aboutBtn"],
                                        "floatingActions" : [],
                                        "footer" : [],
                                        "subHeader": [],
                                        "subHeaders": []  // for backward compatibility with older SAP UI5
                                    }
                                }
                            }
                        }
                    }
                }
            };
