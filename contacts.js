$(document).ready(function () {

	// Event aggregator
	var Event = _.extend({}, Backbone.Events);

	var Contact = Backbone.Model.extend({
		fullName: function () {
			if (!this.get("firstName") && !this.get("lastName")) return "";
			return (this.get("firstName") + " " + this.get("lastName"));
		},
		// Override to include fullName property.
		toJSON: function () {
			var atts = _.extend(this.attributes, { "fullName": this.fullName() } );
			return Backbone.Model.prototype.toJSON.call(this, atts);
		}
	});

	var ContactList = Backbone.Collection.extend({
		model: Contact,
		localStorage: new Store("contacts"),
		comparator: function (user){
			return user.get("firstName");
		},
		initialize: function () {
			_.bindAll(this, "change");
			// Why is this needed? Should happen automatically
			this.bind("change", this.sort);
		}
	});

	var Contacts = new ContactList();

	var SideBarView = Backbone.View.extend({
		template: $("#contact-short").template(),
		events: {
			"click li" : "select",
			"click button" : "create"
		},
		initialize: function () {
			_.bindAll(this, "select", "change", "create", "render");
			this.items = this.$(".items");
			Contacts.bind("add", this.render);
			Contacts.bind("change", this.render);
			Contacts.bind("destroy", this.render);
			Event.bind("show:contact", this.change);
			Event.bind("edit:contact", this.change);
		},
		render: function () {
			var list = $.tmpl(this.template, Contacts.toJSON());
			$(this.items).html(list);
		},
		select: function (e) {
			var pos = $(e.target).index(),
				contact = Contacts.at(pos);
			Event.trigger("show:contact", contact);
		},
		change: function (item) {
			if (!item.collection) return;
			var pos = Contacts.indexOf(item);
			$("li", this.items).each(function (index) {
				if (index == pos) $(this).addClass("selected");
				else $(this).removeClass("selected");
			});
		},
		create: function (contact) {
			var contact = Contacts.create();
			Event.trigger("edit:contact", contact);
		}
	});

	var DetailsView = Backbone.View.extend({
		showTemplate: $("#show-contact").template(),
		editTemplate: $("#edit-contact").template(),
		events: {
			"click .optEdit" : "edit",
			"click .optSave" : "save",
			"click .optDelete" : "destroy"
		},
		fields: ["firstName", "lastName", "email", "mobile"],
		initialize: function () {
			_.bindAll(this, "change", "show", "edit", "render");
			Event.bind("show:contact", this.show);
			Event.bind("edit:contact", this.edit);
			this.showEl = $(".show", this.el);
			this.editEl = $(".edit", this.el);
			this.showContent = $(".content", this.showEl);
			this.editContent = $(".content", this.editEl);
		},
		change: function (contact) {
			this.current = contact;
			this.render();
		},
		show: function (item) {
			if (item) this.change(item);
			this.showEl.show();
			this.editEl.hide();
		},
		edit: function (item) {
			if (item && item.collection) this.change(item);
			this.showEl.hide();
			this.editEl.show();
		},
		destroy: function (item) {
			if (item && item.collection) this.change(item);
			if (!this.current) return false;
			var proceed = confirm("Really delete?");
			if (proceed) {
				this.current.destroy();
				this.current = null;
				Event.trigger("show:contact", Contacts.at(0) || Contacts.create());
			}
		},
		render: function () {
			if (!this.current) return;
			var showContent = $.tmpl(this.showTemplate, this.current.toJSON()),
				editContent = $.tmpl(this.editTemplate, this.current.toJSON());
			$(this.showContent).html(showContent);
			$(this.editContent).html(editContent);
		},
		save: function () {
			if (!this.current) return;
			var c = this.current,
				el = this.editEl,
				attrs = {};

			$.each($('form', el).serializeArray(), function(i, field) {
				attrs[field.name] = field.value;
			});

			console.log(attrs);
			c.set(attrs);
			c.save();
			Event.trigger("show:contact", c);
		},
	});

	var AppView = Backbone.View.extend({

		initialize: function () {

			this.Sidebar = new SideBarView({el: $("#sidebar")});
			this.Details = new DetailsView({el: $("#contact")});

			Contacts.fetch();

			this.Sidebar.render();
			Event.trigger("show:contact", Contacts.at(0) || Contacts.create());
		}
	});

	window.App = new AppView;

});
