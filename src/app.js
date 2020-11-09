const Backbone = require('../node_modules/backbone/backbone');
const $ = require('../node_modules/jquery/dist/jquery');
const _ = require('../node_modules/underscore/underscore');

//==================================================
// ModelとViewの連携でItemを作る
//==================================================
const Item = Backbone.Model.extend({
    defaults: {
        text: '',
        isDone: false,
        editMode: false,
        matchSearch: true
    }
});
const Form = Backbone.Model.extend({
    defaults: {
        val: '',
        hasError: false,
        errorMsg: ''
    }
});
const form = new Form();

const Search = Backbone.Model.extend({
    defaults: {
        val: ''
    }
});
const search = new Search();

const ItemView = Backbone.View.extend({
    template: _.template($('#template-list-item').html()),
    events: {
        'click .js-toggle-done': 'toggleDone',
        'click .js-click-trash': 'remove',
        'click .js-todo_list-text': 'showEdit',
        'keyup .js-todo_list-editForm': 'closeEdit'
    },
    initialize: function() {
        _.bindAll(this, 'update','toggleDone', 'remove', 'showEdit', 'closeEdit', 'render');
        // オブザーバパターンを利用してモデルのイベントを購読
        this.model.bind('change', this.render);
        this.model.bind('destroy', this.remove);
        this.render();
    },
    update: function (text) {
        this.model.set({text: text});
    },
    toggleDone: function () {
        this.model.set({isDone: !this.model.get('isDone')});
    },
    remove: function () {
        $(this.el).remove();
        return this;
    },
    showEdit: function () {
        this.model.set({editMode: true});
    },
    closeEdit: function (e) {
        if(e.keyCode === 13 && e.shiftKey === true){
            this.model.set({text: e.currentTarget.value, editMode: false});
        }
    },
    render: function () {
        console.log('render item');
        let template = this.template(this.model.attributes);
        $(this.el).html(template);
        return this;
    }
});

const FormView = Backbone.View.extend({
    el: $('.js-form'),
    template: _.template($('#template-form').html()),
    model: form,
    events: {
        'click .js-add-todo': 'addTodo'
    },
    initialize: function () {
        _.bindAll(this, 'render', 'addTodo');
        this.model.bind('change', this.render);
        this.render();
    },
    addTodo: function (e) {
        e.preventDefault();
        if($('.js-get-val').val() === '') {
            this.model.set({hasError: true});
            this.model.set({errorMsg: '入力されていません'});
        } else {
            this.model.set({val: $('.js-get-val').val()});
            listView.addItem(this.model.get('val'));
            this.model.set({hasError: false});
        }
    },
    render: function () {
        const template = this.template(this.model.attributes);
        this.$el.html(template);
        return this;
    }
});
new FormView();

//==================================================
// Collectionの使い方
//==================================================
const List = Backbone.Collection.extend({
    model: Item
});

let item1 = new Item({text: 'study js'});
let item2 = new Item({text: 'cooking'});
let list= new List([item1, item2]);

console.log(list);

list.each(function (e, i) {
    console.log('[' + i + ']' + e.get('text'));
})

//==================================================
// CollectionとViewの連携
//==================================================
const ListView = Backbone.View.extend({
    el: $('.js-todo_list'),
    collection: list,
    initialize: function (){
        _.bindAll(this, 'render', 'addItem', 'appendItem');
        this.collection.bind('add', this.appendItem);
        this.render();
    },
    addItem: function (text){
        const model = new Item({text: text});
        this.collection.add(model); // addイベントが発生し、this.appendItemが呼ばれる
    },
    appendItem: function (model){
        const itemView = new ItemView({model: model});
        this.$el.append(itemView.render().el);
    },
    render: function (){
        console.log('render list');
        const that = this;
        this.collection.each(function (model, i) {
            that.appendItem(model);
        });
        return this;
    }
});

const listView = new ListView({collection: list});
listView.addItem('clean room');
listView.addItem('training');

const SearchView = Backbone.View.extend({
    el: $('.js-searchBox'),
    template: _.template($('#template-search').html()),
    model: search,
    collection: list,
    events: {
        'keyup .js-search': 'isSearch'
    },
    initialize: function () {
        _.bindAll(this, 'render', 'isSearch');
        this.render();
    },
    isSearch: function () {
        this.model.set({val: $('.js-search').val()});
        const searchText = this.model.get('val');

        this.collection.each(function (model, i) {
            $('.js-todo_list-item').show();
            let text = model.get('text');

            let regExp = new RegExp('^' + searchText);

            if(text && text.match(regExp)) {
                console.log(`${i}個目の${text}がヒット`);
                model.set({matchSearch: true});
            } else {
                console.log(`${i}個目の${text}はヒットしていない`);
                model.set({matchSearch: false});
            }

        });
    },
    render: function () {
        const searchTemplate = this.template(this.model.attributes);
        this.$el.html(searchTemplate);
        return this;
    }
});
new SearchView();