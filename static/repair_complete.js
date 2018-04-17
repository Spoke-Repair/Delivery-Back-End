Vue.prototype.$eventHub = new Vue();

Vue.component('customer-item', {
    props: ['customer'],
    template: `<tr>
                <td>{{customer.name}}</td>
                <td>
                    <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#modal-popup" v-if="!customer.date" v-on:click="setDate">Set date</button>
                    <span v-else><p>{{formattedDate}}</p><button type="button" class="btn btn-primary" data-toggle="modal" data-target="#modal-popup" v-on:click="setDate">Change date</button></span>
                </td>
                <td>
                    <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#modal-popup" v-if="!customer.price" v-on:click="setPrice">Set price</button>
                    <span v-else><p>{{price}}</p><button type="button" class="btn btn-primary" data-toggle="modal" data-target="#modal-popup" v-on:click="setPrice">Change price</button></span>
                </td>
                <td>
                    <button type="button" class="btn btn-primary" disabled v-if="customer.completed">Completed</button>
                    <button type="button" class="btn btn-primary" v-else v-on:click="sendCompletion">Finish</button>
                </td>
               </tr>`,
    methods: {
        'setPrice': function() {
            this.changeActiveCustomer();
            this.$eventHub.$emit('changeModalType', 'price');
        },
        'setDate': function() {
            this.changeActiveCustomer();
            this.$eventHub.$emit('changeModalType', 'date');
        },
        'changeActiveCustomer': function() {
            // Change the active customer remotely by sending the info about the current customer.
            this.$eventHub.$emit('changeModalName', this.customer.name)
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
                <table class="table">
                    <thead>
                        <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Est. completion date</th>
                            <th scope="col">Price</th>
                            <th scope="col">Complete repair</th>
                        </tr>
                    </thead>
                    <tbody>
                        <customer-item v-for="customer in customers" v-bind:customer="customer">
                        </customer-item>
                    </tbody>
                </table></div>`,
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
                    'date': curCustomer.eta_date == "" ? "" : new Date(curCustomer.eta_date),
                    'key': curCustomer.row_number,
                    'price': curCustomer.price
                }
                return curCustObj;
            })
        }.bind(this))
    }
})

Vue.component('modal-date', {
    template: `<div class="modal-body">
                    <div id="datepicker"></div>
                </div>`
})

Vue.component('modal-price', {
    template: `<div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text">$</span>
                    </div>
                    <input type="text" class="form-control">
                </div>`
})

Vue.component('date-update-modal', {
    template: `<div class="modal fade" id="modal-popup" tabindex="-1" role="dialog" aria-hidden="true">
                  <div class="modal-dialog" role="document">
                    <div class="modal-content">
                      <div class="modal-header">
                        <h5 class="modal-title">Change {{modalType}} for {{displayName}}</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                          <span aria-hidden="true">&times;</span>
                        </button>
                      </div>
                      <modal-date v-if="modalType == 'date'"/>
                      <modal-price v-if="modalType == 'price'"/>
                      <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" data-dismiss="modal" v-on:click="changeActiveCustomerDate">Save changes</button>
                      </div>
                    </div>
                  </div>
                </div>`,
    mounted: function () {
        $('#datepicker').datepicker({
            onSelect: function(dateText, inst) {
                this.activeCustomer.date = new Date(dateText);
            }.bind(this)
        });

        // Receiving the change in activeCustomer means that "Update" was pressed for one customer.
        // Have to change the information for that customer in anticipation of the date changing.
        // (and to update the title of the modal)
        this.$eventHub.$on('changeModalName', function(name) {
            this.displayName = name;
        }.bind(this))
        this.$eventHub.$on('changeActiveCustomer', function(customer) {
            this.activeCustomer = customer;
        }.bind(this))
        this.$eventHub.$on('changeModalType', function(type) {
            this.modalType = type;
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
    template: '<div><date-update-modal/><customers/></div>'
})