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
    .controller('PageController', function ($scope, $interval, $timeout, socket) {
        $scope.active = false;

        var maxSpeed = 2;
        var maxDuration = 20 * 100;


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
                "Results, not excuses!",
                "Leave nothing, take everything!",
                "Don't break stride!",
                "Try it one more time!",
                "Keep on rocking it!"
            ]
        };


        $scope.start = function () {
            if ($scope.viewModel.graph.currentLine) {
                $scope.viewModel.graph.oldLines.push($scope.viewModel.graph.currentLine);
            }
            $scope.viewModel.graph.currentLine = null;
            $scope.viewModel.button.countdown = 5;
            $scope.viewModel.button.class = 'btn-danger';

            var interval = $interval(function () {
                $scope.viewModel.button.countdown--;

                if ($scope.viewModel.button.countdown <= 2) {
                    $scope.viewModel.button.class = 'btn-warning';
                }

                if ($scope.viewModel.button.countdown === 0) {

                    $interval.cancel(interval);
                    $scope.viewModel.button.countdown = null;
                    $scope.active = true;
                    $scope.viewModel.button.class = 'btn-success';
                }
            }, 100);
        };


        $scope.data = [];


        $scope.graph = {
            width: 800,
            height: 300
        };

        $scope.$watch('active', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                if (newValue === true) {

                    $scope.data = [];

                    $timeout(function () {
                        $scope.active = false;

                    }, maxDuration); // How long can the runner run?
                } else {
                    console.log($scope.data);
                    if ($scope.viewModel.quotes.length > 1) {
                        $scope.viewModel.quotes = $scope.viewModel.quotes.slice(1);
                    }
                }
            }
        });

        var xScale = d3.time.scale()
            .domain([0, maxDuration])
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
                    console.log('setting recentTopSpeed');
                    $scope.viewModel.recentTopSpeed = true;
                }

                $scope.viewModel.graph.currentLine = lineGenerator($scope.data);

            }
            //console.log(data);
        });
    });