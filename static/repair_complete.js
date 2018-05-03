Vue.prototype.$eventHub = new Vue();

Vue.component('customer-item', {
    props: ['customer'],
    template: `
    <div class="card">
        <div class="card-body" v-bind:class="{'bg-light': customer.completed}">
            <h5 style="display:inline-block;" class="card-title">{{customer.customer_name}}</h5>
            <span class="font-weight-light float-right" v-if="customer.date">Est. {{formattedDate}}</span>
            <p>
                <p v-if="customer.repair_summary">
                    <span v-for="line in delineatedSummary">{{line}}<br></span>
                </p>
                <p>
                    <span v-if="customer.price">$\{{customer.price}}</span><span v-else class="font-italic">Price not set</span>
                    <span v-if="customer.completed" class="font-italic float-right">(Completed)</span>
                    <a v-else href="#" class="card-link float-right" v-on:click="setActiveCustomer" data-target="#modal-order-edit" data-toggle="modal">Edit</a>
                </p>
                <p>
                    <span v-if="!customer.delivery_requested" class="badge badge-pill badge-secondary float-right disabled">Awaiting delivery response</span>
                    <span v-else class="badge badge-pill badge-primary float-right">Delivery requested</span>
                </p>
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
        },
        'delineatedSummary': function() {
            return this.customer.repair_summary.split('\n');
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
        },
        getOrders: function() {
            axios.get('/get-orders').then(function(res) {
                this.customers = res.data.map(function(curCustomer) {
                    var curCustObj = {
                        'customer_name': curCustomer.customer_name,
                        'completed': curCustomer.completed == true,
                        'date': curCustomer.eta_date == false ? undefined : new Date(curCustomer.eta_date),
                        'key': curCustomer.key,
                        'price': curCustomer.price == false ? undefined : Number(curCustomer.price),
                        'repair_summary': curCustomer.repair_summary == false ? undefined : curCustomer.repair_summary,
                        'delivery_requested': curCustomer.delivery_requested == false ? undefined : curCustomer.delivery_requested
                    }
                    console.log(curCustObj['delivery_requested'])
                    return curCustObj;
                })
            }.bind(this));
        }
    },
    data: function() {
        return {
            'customers': []
        }
    },
    mounted: function() {
        this.getOrders();

        // refresh if an order has been submitted by "Create work order"
        this.$eventHub.$on('orderSubmitted', function(){
            this.getOrders();
        }.bind(this))
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

        this.$eventHub.$on('editingOff', function() {
            this.editing = true;
        }.bind(this));
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
                        <input id="edit-price-input" type="text" class="form-control">
                        <div class="input-group-append">
                            <button class="btn btn-outline-secondary" type="button" v-on:click="updatePrice">Save</button>
                        </div>
                    </div>

                    <p :class="{hide: !editing}">
                        <span>Price: <span v-if="activeCustomer.price">$\{{activeCustomer.price}}</span><span v-else class="font-italic">(Not set)</span></span>
                        <a v-on:click="enterEditMode"><img class="float-right" src="imgs/edit.png"/></a>
                    </p>
              </div>`,
    mounted: function() {
        this.$eventHub.$on('editingOff', function() {
            this.editing = true;
        }.bind(this));
    },
    methods: {
        'updatePrice': function() {
            var inputDOMElem = document.getElementById('edit-price-input');
            this.modifyActiveCustomer({'price': inputDOMElem.value});
            inputDOMElem.value = '';
            this.editing = !this.editing;
        },
        'modifyActiveCustomer': function(customer) {
            this.$emit('modifyActiveCustomer', customer);
        },
        'enterEditMode': function() {
            document.getElementById('edit-price-input').value = this.activeCustomer.price || '';
            this.editing = !this.editing;
        }
    },
    data: function() {
        return {
            'editing': this.activeCustomer.price == undefined,
            'prevPrice': this.activeCustomer.price
        }
    }
})

Vue.component('edit-summary', {
    props: ['activeCustomer'],
    template: `<div>
                    <div :class="{hide: editing}" class="input-group">
                        <textarea id="edit-summary-input" class="form-control">{{activeCustomer.repair_summary}}</textarea>
                        <div class="input-group-append">
                            <button class="btn btn-outline-secondary" type="button" v-on:click="updateSummary">Save</button>
                        </div>
                    </div>
                    <p :class="{hide: !editing}">
                        <span v-if="activeCustomer.repair_summary">{{activeCustomer.repair_summary}}</span>
                        <span v-else class="font-italic">(No repair summary)</span>
                        <a v-on:click="enterEditMode"><img class="float-right" src="imgs/edit.png"/></a>
                    </p>
               </div>`,
    mounted: function() {
        this.$eventHub.$on('editingOff', function() {
            this.editing = true;
        }.bind(this));
    },
    methods: {
        enterEditMode: function() {
            document.getElementById('edit-summary-input').value = this.activeCustomer.repair_summary || '';
            this.editing = !this.editing;
        },
        updateSummary: function() {
            var inputDOMElem = document.getElementById('edit-summary-input');
            this.modifyActiveCustomer({'repair_summary': inputDOMElem.value});
            inputDOMElem.value = '';
            this.editing = !this.editing;
        },
        modifyActiveCustomer: function(customer) {
            this.$emit('modifyActiveCustomer', customer);
        }
    },
    data: function() {
        return {
            'editing': this.activeCustomer.repair_summary == undefined
        }
    }
})

Vue.component('edit-customer-modal', {
    props: ['activeCustomer'],
    template: `<div class="modal fade" id="modal-order-edit" tabindex="-1" role="dialog" aria-hidden="true">
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
                      <edit-summary :activeCustomer="activeCustomer" @modifyActiveCustomer="modifyActiveCustomer"/>
                      <div class="modal-footer">
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

Vue.component('create-customer-modal', {
    template: `<div class="modal fade" id="modal-order-creation" tabindex="-1" role="dialog" aria-hidden="true">
                  <div class="modal-dialog" role="document">
                    <div class="modal-content">
                      <div class="modal-header">
                        <h5 class="modal-title">Enter work order details</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                          <span aria-hidden="true">&times;</span>
                        </button>
                      </div>
                      <div class="modal-body">
                        <form>
                          <div class="form-group">
                            <label>Customer name</label>
                            <input v-model="customer_name" id="create-customer-name" type="text" class="form-control" placeholder="Enter customer name">
                          </div>
                          <div class="form-group">
                            <label>Customer phone number</label>
                            <input v-model="customer_phone" id="create-customer-phone" type="text" class="form-control" placeholder="Enter customer phone number">
                          </div>
                          <div class="form-group">
                            <label>Repair summary</label>
                            <textarea v-model="repair_summary" id="create-customer-repair" class="form-control" placeholder="(optional) Enter notes about the repair"></textarea>
                          </div>
                        </form>
                      </div>
                      <div class="modal-footer">
                        <button @click="submitForm" :disabled="!readyToSubmit" data-dismiss="modal" type="button" class="btn btn-primary">Create</button>
                      </div>
                    </div>
                  </div>
                </div>`,
    methods: {
        submitForm: function() {
            axios.post('/new-work-order', {
                "customer_name": this.customer_name,
                "customer_phone": this.customer_phone,
                "repair_summary": this.repair_summary
            })

            this.$eventHub.$emit('orderSubmitted');

            // clear the fields
            this.customer_name = "";
            this.customer_phone = "";
            this.repair_summary = "";
        }
    },
    data: function() {
        return {
            "customer_name": "",
            "customer_phone": "",
            "repair_summary": ""
        }
    },
    computed: {
        'readyToSubmit': function() {
            return this.customer_name != "" && this.customer_phone != "";
        }
    }
})

var deliveryView = new Vue({
    el: '#customers',
    template: `<div class="container">
                    <edit-customer-modal :activeCustomer="stagedCustomer" @modifyActiveCustomer="modifyActiveCustomer" @submitCustomerChanges="submitCustomerChanges" @completeOrder="completeOrder"/>
                    <create-customer-modal/>
                    <customers :activeCustomer="activeCustomer" @setActiveCustomer="setActiveCustomer"/>
                    <button class="btn btn-primary" data-toggle="modal" data-target="#modal-order-creation">Create work order</button>
                </div>`,
    methods: {
        setActiveCustomer: function(candidateCustomer) {
            // initialize active customer, but this won't be touched until submit is clicked
            this.activeCustomer = candidateCustomer;
            this.$eventHub.$emit('editingOff');
            this.stagedCustomer = this.initStagedCustomer();
            console.log(this.stagedCustomer)
            // initialize a stageCustomer to keep track of fields without updating original data (activeCustomer)
            // use this for the display of changes within the modal.
            for (var prop in candidateCustomer) {
                if (candidateCustomer.hasOwnProperty(prop)) {
                    this.stagedCustomer[prop] = candidateCustomer[prop]
                }
            }
        },
        modifyActiveCustomer: function(dirtyProps) {
            for (var dirtyProp in dirtyProps) {
                if (dirtyProps.hasOwnProperty(dirtyProp)) {
                    this.stagedCustomer[dirtyProp] = dirtyProps[dirtyProp];
                }
            }
        },
        submitCustomerChanges: function() {
            // TODO: check for any changes to the original by comparing stagedCustomer and activeCustomer
            for (var dirtyProp in this.stagedCustomer) {
                if (this.stagedCustomer.hasOwnProperty(dirtyProp)) {
                    this.activeCustomer[dirtyProp] = this.stagedCustomer[dirtyProp];
                }
            }
            axios.post('/change-customer', this.activeCustomer);
        },
        completeOrder: function() {
            // TODO: properly update based on staged
            this.activeCustomer.completed = true;
            axios.post('/send-completion', this.activeCustomer);
        },
        initStagedCustomer: function() {
            return {
                'customer_name': "",
                'date': undefined,
                'price': undefined,
                'key': 0,
                'completed': false,
                'repair_summary': undefined
            }
        }
    },
    data: function() {
        return {
            'activeCustomer': {
                'customer_name': "",
                'date': undefined,
                'price': undefined,
                'key': 0,
                'completed': false,
                'repair_summary': undefined
            },
            'stagedCustomer': this.initStagedCustomer()
        }
    }
})