angular
    .module('myApp.page', [
        'ui.router'
    ])
    .config(function ($stateProvider) {
        $stateProvider.state('page', {
            url: '/',
            templateUrl: 'page/page.html',
            controller: 'PageController'
        });
    })
    .controller('PageController', function ($scope, $document, $interval, $timeout, socket) {
        $scope.active = false;

        var secondsOfRecording = 5;
        var maxSpeed = 8;


        $scope.viewModel = {
            button: {
                countdown: null,
                class: 'btn-success'
            },
            points: [],
            graph: {
                currentLine: null,
                oldLines: []
            },
            topSpeed: 0,
            runs: 0,
            recentTopSpeed: false,
            quotes: [
                "Ready to rock it?",
                "Great job!",
                "Keep up the good work!",
                "You can do better!",
                "Leave nothing, take everything!",
                "Don't break stride!",
                "Try it one more time!",
                "Keep on rocking it!"
            ]
        };

        $scope.$watch('viewModel.button.countdown', function (newValue, oldValue) {
            console.log('viewModel.button.countdown change: ' + newValue);
            if (oldValue === null && newValue !== null) {
                // Starting countdown!
                if ($scope.viewModel.graph.currentLine) {
                    $scope.viewModel.graph.oldLines.push($scope.viewModel.graph.currentLine);
                }
                $scope.viewModel.graph.currentLine = null;
            }

            if (newValue === null) {
                $scope.viewModel.button.class = 'btn-success';
            } else if (newValue > 2) {
                $scope.viewModel.button.class = 'btn-danger';
            } else {
                $scope.viewModel.button.class = 'btn-warning';
            }
        });

        // Called when user clicks button (local)
        $scope.start = function () {
            if (!window.io) { // Run a simulation if we don't have real data.
                $scope.viewModel.button.countdown = 5;

                var interval = $interval(function () {
                    $scope.viewModel.button.countdown--;
                    if ($scope.viewModel.button.countdown === 0) {
                        $interval.cancel(interval);
                        $scope.viewModel.button.countdown = null;
                        $scope.active = true;
                        $timeout(function () {
                            $scope.active = false;
                        }, secondsOfRecording * 1000);
                    }
                }, 1000);
            }
        };


        $scope.data = [];

        var element = document.getElementById('graph-area');
        $scope.graph = {
            width: element.offsetWidth, // to the containers size (roughly)
            height: 270
        };

        $scope.$watch('active', function (newValue, oldValue) {
            console.log('active change: ' + newValue + '/' + oldValue);
            if (newValue !== oldValue) {
                if (newValue === true) {
                    $scope.data = [];
                } else {
                    if ($scope.viewModel.quotes.length > 1) {
                        $scope.viewModel.quotes = $scope.viewModel.quotes.slice(1);
                    }
                }
            }
        });

        var xScale = d3.time.scale()
            .domain([0, secondsOfRecording * 1000])
            .range([0, $scope.graph.width]);

        var yScale = d3.scale.linear()
            .domain([0, maxSpeed])
            .range([$scope.graph.height, 0]);

        var lineGenerator = d3.svg.line()
            .x(function (d) {
                //console.log(d.time - startTime);
                return xScale(d.time - startTime);
            })
            .y(function (d) {
                return yScale(d.speed);
            });


        var startTime = null;
        socket.on('data', function (data) {
            if ($scope.active) {
                if ($scope.data.length === 0) { // Starting a new run
                    startTime = data.time;
                    $scope.viewModel.runs++;
                    $scope.viewModel.recentTopSpeed = false;
                }
                $scope.data.push(data);


                if (data.speed > $scope.viewModel.topSpeed) {
                    $scope.viewModel.topSpeed = data.speed;
                    $scope.viewModel.recentTopSpeed = true;
                }

                $scope.viewModel.graph.currentLine = lineGenerator($scope.data);
            }
        });

        socket.on('control', function (data) {
            console.log('Got control! ' + JSON.stringify(data));
            $scope.active = data.active;
            $scope.viewModel.button.countdown = data.countdown;
        });
    });