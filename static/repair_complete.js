Vue.prototype.$eventHub = new Vue();

Vue.component('customer-item', {
    props: ['customer'],
    template: `
    <div class="card">
        <div class="card-body" v-bind:class="{'bg-light': customer.completed}">
            <h5 style="display:inline-block;" class="card-title">{{customer.name}}</h5>
            <span class="font-weight-light float-right" v-if="customer.date">Est. {{formattedDate}}</span>
            <div class="col-xs-2">{{customer.price}}</div>
            <span v-if="customer.price">$\{{customer.price}}</span><span v-else class="font-italic">Price not set</span>
            <span v-if="customer.completed" class="font-italic float-right">(Completed)</span>
            <a v-else href="#" class="card-link float-right" v-on:click="changeActiveCustomer" data-target="#modal-popup" data-toggle="modal">Edit</a>
        </div>
    </div>`,
    methods: {
        'changeActiveCustomer': function() {
            // Change the active customer remotely by sending the info about the current customer.
            this.$eventHub.$emit('changeActiveCustomer', this.customer)
        },
        'sendCompletion': function() {
            this.customer.completed = true;
            axios.post('/send-completion', this.customer)
        }
    },
    mounted: function() {
        this.$eventHub.$on('activeCustomerDateChanged', function(activeCustomer) {
            if (this.customer.key == activeCustomer.key)
                this.customer.date = activeCustomer.date;
        }.bind(this));
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
    template: `<div id="customers">
                    <customer-item v-for="customer in customers" v-bind:customer="customer">
                    </customer-item>
                </div>`,
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
        }.bind(this))
    }
})

Vue.component('edit-date', {
    props: ['activeCustomer'],
    template: `<div>
                <div v-bind:class="{hide: editing}" id="datepicker">
                </div>
                <p v-bind:class="{hide: !editing}">
                    <span>Est. completion: {{formattedDate}}</span>
                    <a v-on:click="toggleEditing"><img class="float-right" src="imgs/edit.png"/></a>
                </p>
                </div>`,
    mounted: function() {
        $('#datepicker').datepicker({
            inline: true,
            onSelect: function(dateText, inst) {
                this.date = new Date(dateText);
                this.toggleEditing()
            }.bind(this)
        });
    },
    methods: {
        'toggleEditing': function() {
            console.log(this.editing)
            this.editing = !this.editing;
        }
    },
    data: function() {
        return {
            'editing': this.activeCustomer.date == undefined,
            'date': this.activeCustomer.date
        }
    },
    computed: {
        'formattedDate': function() {
            if (this.date)
                return this.date.toLocaleDateString('en-US')
            else
                return undefined;
        }
    }
})

Vue.component('edit-price', {
    props: ['activeCustomer'],
    template: `<div><div v-if="editing" class="input-group mb-3">
                <div class="input-group-prepend">
                    <span class="input-group-text">$</span>
                </div>
                <input type="text" class="form-control">
                <div class="input-group-append">
                    <button class="btn btn-outline-secondary" type="button" v-on:click="toggleEditing">Cancel</button>
                </div>
              </div>

              <p v-else>
                <span>Price: <span v-if="price">$\{{price}}</span><span v-else class="font-italic">(Not set)</span></span>
                <a v-on:click="toggleEditing"><img class="float-right" src="imgs/edit.png"/></a>
              </p></div>`,
    methods: {
        'toggleEditing': function() {
            this.editing = !this.editing;
        }
    },
    data: function() {
        return {
            'editing': this.price == undefined,
            'price': this.activeCustomer.price
        }
    }
})

Vue.component('edit-customer-modal', {
    template: `<div class="modal fade" id="modal-popup" tabindex="-1" role="dialog" aria-hidden="true">
                  <div class="modal-dialog" role="document">
                    <div class="modal-content" style="padding:15px;">
                      <div class="modal-header">
                        <h5 class="modal-title">Edit info for {{activeCustomer.name}}</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                          <span aria-hidden="true">&times;</span>
                        </button>
                      </div>
                      <edit-date v-bind:activeCustomer="activeCustomer"/>
                      <edit-price v-bind:activeCustomer="activeCustomer"/>
                      <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" data-dismiss="modal" v-on:click="changeActiveCustomerDate">Save changes</button>
                      </div>
                    </div>
                  </div>
                </div>`,
    mounted: function () {

        // Receiving the change in activeCustomer means that "Update" was pressed for one customer.
        // Have to change the information for that customer in anticipation of the date changing.
        // (and to update the title of the modal)
        this.$eventHub.$on('changeActiveCustomer', function(customer) {
            this.activeCustomer = customer;
            console.log(this.activeCustomer)
        }.bind(this))
    },
    methods: {
        'changeActiveCustomerDate': function() {
            axios.post('/change-date', this.activeCustomer)
            this.$eventHub.$emit('activeCustomerDateChanged', this.activeCustomer);
        }
    },
    data: function() {
        return {
            'activeCustomer': {
                'name': "",
                'date': undefined,
                'price': undefined,
                'key': 0
            },
            'displayName': "",
            'modalType': ""
        }
    }
})

var deliveryView = new Vue({
    el: '#customers',
    template: '<div><edit-customer-modal/><customers/></div>'
})