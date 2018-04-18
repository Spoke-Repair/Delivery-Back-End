Vue.prototype.$eventHub = new Vue();

Vue.component('customer-item', {
    props: ['customer'],
    template: `
    <div class="card">
        <div class="card-body" v-bind:class="{'bg-light': customer.completed}">
            <h5 style="display:inline-block;" class="card-title">{{customer.name}}</h5>
            <span class="font-weight-light float-right" v-if="customer.date">Est. {{formattedDate}}</span>
            <p>
                <span v-if="customer.price">$\{{customer.price}}</span><span v-else class="font-italic">Price not set</span>
                <span v-if="customer.completed" class="font-italic float-right">(Completed)</span>
                <a v-else href="#" class="card-link float-right" v-on:click="setActiveCustomer" data-target="#modal-popup" data-toggle="modal">Edit</a>
            </p>
        </div>
    </div>`,
    methods: {
        'setActiveCustomer': function() {
            // Change the active customer remotely by sending the info about the current customer.
            this.$emit('setActiveCustomer', this.customer);
        },
        'sendCompletion': function() {
            this.customer.completed = true;
            axios.post('/send-completion', this.customer)
        }
    },
    computed: {
        'formattedDate': function() {
            if (this.customer.date != "")
                return this.customer.date.toLocaleDateString('en-US')
            else
                return this.customer.date;
        }
    }
})


Vue.component('customers', {
    props: ['activeCustomer'],
    template: `<div id="customers">
                    <customer-item v-for="customer in customers" v-bind:customer="customer" @setActiveCustomer="setActiveCustomer">
                    </customer-item>
                </div>`,
    methods: {
        setActiveCustomer: function(customer) {
            this.$emit('setActiveCustomer', customer);
        }
    },
    data: function() {
        return {
            'customers': []
        }
    },
    mounted: function() {
        axios.get('/customer-data').then(function(res) {
            this.customers = res.data.map(function(curCustomer) {
                var curCustObj = {
                    'name': curCustomer.name,
                    'completed': curCustomer.completed === 'TRUE',
                    'date': curCustomer.eta_date == "" ? undefined : new Date(curCustomer.eta_date),
                    'key': curCustomer.row_number,
                    'price': curCustomer.price == "" ? undefined : Number(curCustomer.price)
                }
                return curCustObj;
            })
        }.bind(this));

       this.$eventHub.$on('modalModifyActiveCustomer', function(activeCustomer) {
            this.$set(this.customers, activeCustomer.key - 2, activeCustomer);
        }.bind(this));
    }
})

Vue.component('edit-date', {
    props: ['activeCustomer'],
    template: `<div>
                <div v-bind:class="{hide: editing}" id="datepicker">
                </div>
                <p v-bind:class="{hide: !editing}">
                    <span>Est. completion: <span v-if="this.activeCustomer.date">{{formattedDate}}</span><span v-else class="font-italic">(Not set)</span></span>
                    <a v-on:click="toggleEditing"><img class="float-right" src="imgs/edit.png"/></a>
                </p>
                </div>`,
    mounted: function() {
        $('#datepicker').datepicker({
            inline: true,
            onSelect: function(dateText, inst) {
                this.modifyActiveCustomer({'date': new Date(dateText)})
                this.toggleEditing()
            }.bind(this)
        });
    },
    methods: {
        'modifyActiveCustomer': function(customer) {
            this.$emit('modifyActiveCustomer', customer);
        },
        'toggleEditing': function() {
            this.editing = !this.editing;
        }
    },
    data: function() {
        return {
            'editing': this.activeCustomer.date == undefined,
        }
    },
    computed: {
        'formattedDate': function() {
            if (this.activeCustomer.date)
                return this.activeCustomer.date.toLocaleDateString('en-US')
            else
                return undefined;
        }
    }
})

Vue.component('edit-price', {
    props: ['activeCustomer'],
    template: `<div>
                    <div :class="{hide: editing}" class="input-group mb-3">
                        <div class="input-group-prepend">
                            <span class="input-group-text">$</span>
                        </div>
                        <input v-on:input="updatePrice($event.target.value)" v-bind:value="activeCustomer.price" type="text" class="form-control">
                        <div class="input-group-append">
                            <button class="btn btn-outline-secondary" type="button" v-on:click="toggleEditing">Save</button>
                        </div>
                    </div>

                    <p :class="{hide: !editing}">
                        <span>Price: <span v-if="activeCustomer.price">$\{{activeCustomer.price}}</span><span v-else class="font-italic">(Not set)</span></span>
                        <a v-on:click="toggleEditing"><img class="float-right" src="imgs/edit.png"/></a>
                    </p>
              </div>`,
    methods: {
        'updatePrice': function(price) {
            this.modifyActiveCustomer({'price': price})
        },
        'modifyActiveCustomer': function(customer) {
            this.$emit('modifyActiveCustomer', customer);
        },
        'toggleEditing': function() {
            this.editing = !this.editing;
        }
    },
    data: function() {
        return {
            'editing': this.price == undefined,
            'prevPrice': this.activeCustomer.price
        }
    }
})

Vue.component('edit-customer-modal', {
    props: ['activeCustomer'],
    template: `<div class="modal fade" id="modal-popup" tabindex="-1" role="dialog" aria-hidden="true">
                  <div class="modal-dialog" role="document">
                    <div class="modal-content" style="padding:15px;">
                      <div class="modal-header">
                        <h5 class="modal-title">Edit info for {{activeCustomer.name}}</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                          <span aria-hidden="true">&times;</span>
                        </button>
                      </div>
                      <edit-date :activeCustomer="activeCustomer" @modifyActiveCustomer="modifyActiveCustomer"/>
                      <edit-price :activeCustomer="activeCustomer" @modifyActiveCustomer="modifyActiveCustomer"/>
                      <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" data-dismiss="modal" v-on:click="submitCustomerChanges">Submit changes</button>
                        <button type="button" class="btn btn-primary" data-dismiss="modal" :disabled="activeCustomer.completed" v-on:click="completeOrder">Complete</button>
                      </div>
                    </div>
                  </div>
                </div>`,
    methods: {
        'modifyActiveCustomer': function(customer) {
            this.$emit('modifyActiveCustomer', customer);
        },
        'submitCustomerChanges': function() {
            this.$emit('submitCustomerChanges');
        },
        'completeOrder': function() {
            this.$emit('completeOrder');
        }
    }
})

var deliveryView = new Vue({
    el: '#customers',
    template: `<div class="container">
                    <edit-customer-modal :activeCustomer="activeCustomer" @modifyActiveCustomer="modifyActiveCustomer" @submitCustomerChanges="submitCustomerChanges" @completeOrder="completeOrder"/>
                    <customers :activeCustomer="activeCustomer" @setActiveCustomer="setActiveCustomer"/>
                </div>`,
    methods: {
        setActiveCustomer: function(candidateCustomer) {
            this.activeCustomer = candidateCustomer;
        },
        modifyActiveCustomer: function(changedCustomer) {
            for (var dirtyProp in changedCustomer) {
                if (changedCustomer.hasOwnProperty(dirtyProp)) {
                    this.activeCustomer[dirtyProp] = changedCustomer[dirtyProp];
                }
            }
        },
        submitCustomerChanges: function() {
            axios.post('/change-customer', this.activeCustomer);
        },
        completeOrder: function() {
            this.activeCustomer.completed = true;
            axios.post('/send-completion', this.activeCustomer);
        }
    },
    data: function() {
        return {
            'activeCustomer': {
                'name': "",
                'date': undefined,
                'price': undefined,
                'key': 0,
                'completed': false
            }
        }
    }
})