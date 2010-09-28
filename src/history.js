/*
history // 消息历史记录 Support unicast and multicast
attributes：
data 所有信息 readonly 
methods:
unicast(id) //Get
multicast(id) //Get
load(type, id)
clear(type, id)
init(type, id, data)
handle(data) //handle data and distribute events

events:
unicast //id,data
multicast //id,data
clear //type, id
*/

model("history",{
	urls:{ load:"webim/history", clear:"webim/clear_history", download: "webim/download_history" }
}, {
	_init:function(){
		var self = this;
		self.data = self.data || {};
		self.data.unicast = self.data.unicast || {};
		self.data.multicast = self.data.multicast || {};
		if(self.options.jsonp)
			self.request = jsonp;
		else
			self.request = ajax;
	},
	//get: function(type, id){
	//	return this.data[type][id];
	//},
	unicast: function(id){
		return this.data["unicast"][id];
	},
	multicast: function(id){
		return this.data["multicast"][id];
	},
	handle:function(addData){
		var self = this, data = self.data, cache = {"unicast": {}, "multicast": {}};
		addData = makeArray(addData);
		var l = addData.length , v, id, userId = self.options.userInfo.id;
		if(!l)return;
		for(var i = 0; i < l; i++){
			//for(var i in addData){
			v = addData[i];
			type = v.type;
			id = type == "unicast" ? (v.to == userId ? v.from : v.to) : v.to;
			if(id && type){
				cache[type][id] = cache[type][id] || [];
				cache[type][id].push(v);
			}
		}
		for (var type in cache){
			for (var id in cache[type]){
				var v = cache[type][id];
				if(data[type][id]){
					data[type][id] = data[type][id].concat(v);
					self._triggerMsg(type, id, v);
				}else{
					self.load(type, id);
				}
			}
		}
	},
	_triggerMsg: function(type, id, data){
		//this.trigger("message." + id, [data]);
		this.trigger(type, [id, data]);
	},
	clear: function(type, id){
		var self = this, options = self.options;
		self.data[type][id] = [];
		self.trigger("clear", [type, id]);
		self.request({
			url: options.urls.clear,
			type: "post",
			cache: false,
			//dataType: "json",
			data:{ type: type, id: id}
		});
	},
	download: function(type, id){
		var self = this, 
		options = self.options, 
		url = options.urls.download,
		now = (new Date()).getTime(), 
		f = document.createElement('iframe'), 
		d = new Date(),
		ar = [],
		data = {id: id, type: type, time: (new Date()).getTime(), date: d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate() };
		for (var key in data ) {
			ar[ ar.length ] = encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
		}
		url += (/\?/.test( url ) ? "&" : "?") + ar.join("&");
		f.setAttribute( "src", url );
		f.style.display = 'none'; 
		document.body.appendChild(f); 
	},
	init: function(type, id, data){
		var self = this;
		if(isArray(data)){
			self.data[type][id] = data;
			self._triggerMsg(type, id, data);
		}
	},
	load: function(type, id){
		var self = this, options = self.options;
		self.data[type][id] = [];
		self.request({
			url: options.urls.load,
			async: true,
			cache: false,
			type: "get",
			dataType: "json",
			data:{type: type, id: id},
			//context: self,
			success: function(data){
				self.init(type, id, data);
			}
		});
	}
});
