Websites = new Mongo.Collection("websites");
Comments = new Mongo.Collection("comments");

if (Meteor.isClient) {

    Router.configure({
            layoutTemplate: 'ApplicationLayout'
        }
    );
    Router.route('/', function () {
        this.render('navbar', {to: "navbar"});
        this.render('linkList', {to: "main"});
    });

    Router.route('/website/:_id', function () {
        this.render('navbar', {to: "navbar"});
        this.render('website', {
            to: "main",
            data: function () {
                var website = Websites.findOne({_id: this.params._id});
                var comments = Comments.find({'website_id': this.params._id}, {sort: {'createdOn': -1}});
                if (website) {
                    website.comments = comments;
                }
                return website;
            }

        });
    });

    /////
    // template helpers 
    /////

    // helper function that returns all available websites
    Template.website_list.helpers({
        websites: function () {
            return Websites.find({}, {sort: {'upvotes': -1}});
        }
    });

    // helper function that returns all available websites
    Template.search_form.helpers({
        found: function () {
            if (!Session.get("found")) {
                Session.set("found", []);
            }

            return Session.get("found");
        }
    });


    /////
    // template events 
    /////
    function addUpvote(website_id) {
        var website = Websites.findOne({_id: website_id});
        if (website) {
            if (!website.upvotes) {
                website.upvotes = 0;
            }
            website.upvotes++;

        }
        Websites.update({_id: website_id}, {$set: {upvotes: website.upvotes}});
    }

    function addDownvote(website_id) {
        var website = Websites.findOne({_id: website_id});
        if (website) {
            if (!website.downvotes) {
                website.downvotes = 0;
            }
            website.downvotes++;

        }
        Websites.update({_id: website_id}, {$set: {downvotes: website.downvotes}});
    }

    Template.website_item.events({
        "click .js-upvote": function (event) {
            // example of how you can access the id for the website in the database
            // (this is the data context for the template)
            var website_id = this._id;
            console.log("Up voting website with id " + website_id);
            // put the code in here to add a vote to a website!
            addUpvote(website_id);

            return false;// prevent the button from reloading the page
        },
        "click .js-downvote": function (event) {

            // example of how you can access the id for the website in the database
            // (this is the data context for the template)
            var website_id = this._id;
            console.log("Down voting website with id " + website_id);
            addDownvote(website_id);
            // put the code in here to remove a vote from a website!

            return false;// prevent the button from reloading the page
        }
    })

    Template.website_form.events({
        "click .js-toggle-website-form": function (event) {
            $("#website_form").toggle('slow');
        },
        "submit .js-save-website-form": function (event) {

            // here is an example of how to get the url out of the form:
            var url = event.target.url.value;
            var website = {
                title: event.target.title.value,
                url: event.target.url.value,
                description: event.target.description.value,
                createdOn: new Date(),
                upvotes: 0,
                downvotes: 0
            }
            console.log("The url they entered is: ", event);

            Websites.insert(website);

            return false;// stop the form submit from reloading the page

        }
    });

    Template.comment_form.events({

        "submit .js-save-comment-form": function (event) {

            // here is an example of how to get the url out of the form:
            //Websites.insert(website);
            var comment = {
                website_id: event.target.website_id.value,
                comment: event.target.comment.value,
                createdOn: new Date(),
                createdBy: Meteor.user().emails[0].address
            }
            Comments.insert(comment);

            return false;// stop the form submit from reloading the page

        }
    });

    Template.search_form.events({

        "submit .js-search-form": function (event) {
            if (event.target.searchField.value) {
                var regex = new RegExp(event.target.searchField.value);
                Session.set("found", Websites.find(
                    {
                        $or: [
                            {'title': {'$regex': regex, $options: "i"}},
                            {'description': {'$regex': regex, $options: "i"}},
                            {'url': {'$regex': regex, $options: "i"}}]
                    }).fetch());
            }

            return false;
        },

        // clear search form on click
        "click .searchLink": function (event, template) {
            Session.set("found", []);
            template.$('#searchField')[0].value = '';
        }
    });


    Template.registerHelper("prettifyDate", function (d) {

        return d && d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear() + " " +
            d.getHours() + ":" + d.getMinutes();
    });
}

function validateUser(user_id, doc) {
    if (user_id != Meteor.user()._id) {
        return false;
    } else {
        return true;
    }
}

if (Meteor.isServer) {
    Websites.allow({
        insert: function (user_id, doc) {
            return validateUser(user_id, doc);
        },
        remove: function (user_id, doc) {
            return validateUser(user_id, doc);
        },

        update: function (user_id, doc) {
            console.log('everyone can update');
            return true;
        }
    });

    Comments.allow({
        insert: function (user_id, doc) {
            return validateUser(user_id, doc);
        },
        remove: function (user_id, doc) {
            return validateUser(user_id, doc);
        },

        update: function (user_id, doc) {
            console.log('everyone can update');
            return true;
        }
    });

    // start up function that creates entries in the Websites databases.
    Meteor.startup(function () {
        // code to run on server at startup
        if (!Websites.findOne()) {
            console.log("No websites yet. Creating starter data.");
            Websites.insert({
                title: "Goldsmiths Computing Department",
                url: "http://www.gold.ac.uk/computing/",
                description: "This is where this course was developed.",
                createdOn: new Date(),
                upvotes: 0,
                downvotes: 0
            });
            Websites.insert({
                title: "University of London",
                url: "http://www.londoninternational.ac.uk/courses/undergraduate/goldsmiths/bsc-creative-computing-bsc-diploma-work-entry-route",
                description: "University of London International Programme.",
                createdOn: new Date(),
                upvotes: 0,
                downvotes: 0
            });
            Websites.insert({
                title: "Coursera",
                url: "http://www.coursera.org",
                description: "Universal access to the world’s best education.",
                createdOn: new Date(),
                upvotes: 0,
                downvotes: 0
            });
            Websites.insert({
                title: "Google",
                url: "http://www.google.com",
                description: "Popular search engine.",
                createdOn: new Date(),
                upvotes: 0,
                downvotes: 0
            });
        }
    });
}
