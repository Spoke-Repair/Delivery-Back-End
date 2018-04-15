Vue.prototype.$eventHub = new Vue();

Vue.component('customer-item', {
    props: ['customer', 'activeCustomer'],
    template: `<tr>
                <td>{{customer.name}}</td>
                <td>
                    <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#modal-datepicker" v-if="customer.date == undefined">Update</button>
                    <p v-else>{{customer.date}}</p>
                </td>
                <td>
                    <button type="button" class="btn btn-primary" v-if="customer.completed">Finish</button>
                    <button type="button" class="btn btn-primary" disabled v-else>Completed</button>
                </td>
               </tr>`,
    methods: {
        'updateActiveCustomer': function() {
            this.activeCustomer = this.customer.name;
        }
    }
})


Vue.component('customers', {
    props: ['activeCustomer'],
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
                        <customer-item v-for="customer in customers" v-bind:customer="customer" v-bind:activeCustomer="activeCustomer">
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
            // console.log(res)
            this.customers = res.data.map(function(row) {
                return {
                    'name': row[0],
                    'completed': row[9],
                    'date': row[10]
                }
            })
        }.bind(this))
    }
})

Vue.component('date-update-modal', {
    props: ['activeCustomer'],
    template: `<div class="modal fade" id="modal-datepicker" tabindex="-1" role="dialog" aria-hidden="true">
                  <div class="modal-dialog" role="document">
                    <div class="modal-content">
                      <div class="modal-header">
                        <h5 class="modal-title">Change date for {{activeCustomer.name}}</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                          <span aria-hidden="true">&times;</span>
                        </button>
                      </div>
                      <div class="modal-body">
                        <div id="datepicker"></div>
                      </div>
                      <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary">Save changes</button>
                      </div>
                    </div>
                  </div>
                </div>`,
    mounted: function () {
        $('#datepicker').datepicker()
    }
})

var deliveryView = new Vue({
    el: '#customers',
    template: '<div><date-update-modal/><customers v-bind:activeCustomer="activeCustomer"/></div>'
    data: function() {
        return {
            'activeCustomer': {'name': ""}
        }
    }
})