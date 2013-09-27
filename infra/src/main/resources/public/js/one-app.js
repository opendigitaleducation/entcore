var currentLanguage = ( navigator.language || navigator.browserLanguage ).slice( 0, 2 );

if(window.moment){
	moment.lang(currentLanguage, {
		calendar : {
			lastDay : '[Hier à] HH[h]mm',
			sameDay : '[Aujourd\'hui à] HH[h]mm',
			nextDay : '[Demain à] HH[h]mm',
			lastWeek : 'dddd [dernier à] HH[h]mm',
			nextWeek : 'dddd [prochain à] HH[h]mm',
			sameElse : 'dddd LL'
		}
	});
}

humane.timeout = 0;
humane.clickToClose = true;

if(!Date.prototype.toShortString){
	Date.prototype.toShortString = function(){
		var month = this.getMonth() + 1;
		if(parseInt(this.getMonth()) < 10){
			month = '0' + month;
		}
		return this.getDate() +
			"/" + month  +
			"/" +  this.getFullYear();
	}
}

if(parent !== window){
	$(document).ready(function(){
		$('body').on('click', 'a:not([call])', function(e){
			if(!$(this).attr('target') && parent !== window){
				messenger.sendMessage({
					name: 'redirect',
					data: $(this).attr('href')
				});
				e.preventDefault();
			}
		});
	});
}


var oneApp = {
	scope : '#main',
	init : function() {
		var that = this;
		that.i18n.load();
		$('body').delegate(that.scope, 'click',function(event) {
			if (!event.target.getAttribute('call')) return;
			event.preventDefault();
			if(event.target.getAttribute('disabled') !== null){
				return;
			}
			var call = event.target.getAttribute('call');
			that.action[call]({url : event.target.getAttribute('href'), target: event.target});
			event.stopPropagation();
		});
		// TODO : refactor web message dispatch policiy
		window.addEventListener('message', that.message.css, false);
	},
	action : {
	},
	template : {
		getAndRender : function (pathUrl, templateName, elem, dataExtractor){
			var that = this;
			if (_.isUndefined(dataExtractor)) {
				dataExtractor = function (d) { return {list : _.values(d.result)}; };
			}
			$.get(pathUrl)
			.done(function(data) {
				$(elem).html(that.render(templateName, dataExtractor(data)));
			})
			.error(function(data) {
				oneApp.notify.error(data);
			});
		},
		render : function (name, data) {
			_.extend(data, {
				'i18n' : oneApp.i18n.i18n,
				'formatDate' : function() {
					return function(str) {
						var dt = new Date(Mustache.render(str, this).replace('CEST', 'EST')).toShortString();
						return dt;
					};
				},
				'formatDateTime' : function() {
					return function(str) {
						var dt = new Date(Mustache.render(str, this).replace('CEST', 'EST')).toShortString();
						return dt;
					};
				},
				//today, yesterday...
				calendar: function(){
					return function(date) {
						return moment(Mustache.render(date, this).replace('CEST', 'EST')).calendar();
					};
				},
				//0 month 0000
				longDate: function(){
					return function(date) {
						var momentDate = moment(Mustache.render(date, this).replace('CEST', 'EST'));
						if(momentDate !== null){
							return momentDate.format('D MMMM YYYY');
						}
					};
				},
				//0 month
				longDay: function(){
					return function(date) {
						var momentDate = moment(Mustache.render(date, this).replace('CEST', 'EST'));
						if(momentDate !== null){
							return momentDate.format('D MMMM');
						}
					};
				}
			});
			return Mustache.render(this[name] === undefined ? name : this[name], data);
		}
	},
	notify : {
		done : function (msg) { this.instance('success')(msg);},
		error : function (msg) { this.instance('error')(msg); },
		warn : function (msg) {},
		info : function (msg) { this.instance('info')(msg); },
		instance : function(level) {
			return humane.spawn({ addnCls: 'humane-original-' + level });
		}
	},
	i18n : {
		load : function () {
			var that = this;
			$.ajax({url: 'i18n', async: false})
				.done(function(data){
					that.bundle = data;
				})
		},
		bundle : {},
		i18n : function() {
			return function(key) {
				key = Mustache.render(key, this);
				return oneApp.i18n.bundle[key] === undefined ? key : oneApp.i18n.bundle[key];
			};
		},
		translate: function(key){
			return this.i18n()(key);
		}
	},
	message : {
		// TODO : dispatch policiy and paraméter
		css : function(e) {
			if (event.origin == "http://localhost:8008") {
				$("head").append("<link rel='stylesheet' href='" + e.data + "' media='all' />");
			}
		}
	},
	define : function (o) {
		var props = { template : {}, action:{}};
		for (prop in props) {
			for (key in o[prop]) {
				props[[prop]][key] = {'value' : o[[prop]][key]};
			}
			Object.defineProperties(this[prop], props[[prop]]);
		}
	}
};