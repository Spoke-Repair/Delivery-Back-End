Vue.prototype.$eventHub = new Vue();

Vue.component('customer-item', {
    props: ['customer'],
    template: `<tr>
                <td>{{customer.name}}</td>
                <td>
                    <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#modal-datepicker" v-if="customer.date == ''" v-on:click="changeActiveCustomer">Update</button>
                    <p v-else>{{formattedDate}}</p>
                </td>
                <td>
                    <button type="button" class="btn btn-primary" disabled v-if="customer.completed">Completed</button>
                    <button type="button" class="btn btn-primary" v-else v-on:click="sendCompletion">Finish</button>
                </td>
               </tr>`,
    methods: {
        'changeActiveCustomer': function() {
            // Change the active customer remotely by sending the info about the current customer.
            this.$eventHub.$emit('changeModalName', this.customer.name)
            this.$eventHub.$emit('changeActiveCustomer', this.customer)
        },
        'sendCompletion': function() {
            this.customer.completed = true;
            axios.post('/send-completion', {'completedCustomer': this.customer})
        }
    },
    mounted: function() {
        this.$eventHub.$on('activeCustomerDateChanged', function(activeCustomer) {
            if (this.customer.key == activeCustomer.key)
                this.customer.date = activeCustomer.date;
            // TODO: logic to update the sheet with the correct date.
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
                            <th scope="col">Est. competion date</th>
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
                    'completed': curCustomer.completed === 'True',
                    'date': curCustomer.eta_date,
                    'key': curCustomer.row_number
                }
                return curCustObj;
            })
        }.bind(this))
    }
})

Vue.component('date-update-modal', {
    template: `<div class="modal fade" id="modal-datepicker" tabindex="-1" role="dialog" aria-hidden="true">
                  <div class="modal-dialog" role="document">
                    <div class="modal-content">
                      <div class="modal-header">
                        <h5 class="modal-title">Change date for {{displayName}}</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                          <span aria-hidden="true">&times;</span>
                        </button>
                      </div>
                      <div class="modal-body">
                        <div id="datepicker"></div>
                      </div>
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
    },
    methods: {
        'changeActiveCustomerDate': function() {
            axios.post('/change-date', {'dirtyCustomer': this.activeCustomer})
            this.$eventHub.$emit('activeCustomerDateChanged', this.activeCustomer);
        }
    },
    data: function() {
        return {
            'activeCustomer': {
                'name': "",
                'date': new Date(),
                'key': 0
            },
            'displayName': ""
        }
    }
})

var deliveryView = new Vue({
    el: '#customers',
    template: '<div><date-update-modal/><customers/></div>'
})