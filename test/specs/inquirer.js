/**
 * Inquirer public API test
 */

var assert = require("assert");
var expect = require("chai").expect;
var sinon = require("sinon");
var _ = require("lodash");
var rx = require("rx");
var inquirer = require("../../lib/inquirer");

describe("inquirer.prompt", function() {

  it("should close and create a new readline instances each time it's called", function( done ) {
    var rl1;

    var prompt = inquirer.prompt({
      type: "confirm",
      name: "q1",
      message: "message"
    }, function( answers ) {
      var rl2;

      expect(rl1.close.called).to.be.true;
      expect(rl1.output.end.called).to.be.true;
      expect(prompt.rl).to.not.exist;

      var prompt2 = inquirer.prompt({
        type: "confirm",
        name: "q1",
        message: "message"
      }, function( answers ) {
        expect(rl2.close.called).to.be.true;
        expect(rl2.output.end.called).to.be.true;
        expect(prompt.rl).to.not.exist;

        expect( rl1 ).to.not.equal( rl2 );
        done();
      });

      rl2 = prompt2.rl;
      sinon.spy( rl2, "close" );
      sinon.spy( rl2.output, "end" );
      prompt2.rl.emit("line");
    });


    rl1 = prompt.rl;
    sinon.spy( rl1, "close" );
    sinon.spy( rl1.output, "end" );
    prompt.rl.emit("line");

  });

  it("should take a prompts array and return answers", function( done ) {
    var prompts = [{
      type: "confirm",
      name: "q1",
      message: "message"
    }, {
      type: "confirm",
      name: "q2",
      message: "message",
      default: false
    }];

    var ui = inquirer.prompt( prompts, function( answers ) {
      expect(answers.q1).to.be.true;
      expect(answers.q2).to.be.false;
      done();
    });

    ui.rl.emit("line");
    ui.rl.emit("line");
  });

  it("should take a single prompt and return answer", function( done ) {
    var prompt = {
      type: "input",
      name: "q1",
      message: "message",
      default: "bar"
    };

    var ui = inquirer.prompt( prompt, function( answers ) {
      expect(answers.q1).to.equal("bar");
      done();
    });

    ui.rl.emit("line");
  });

  it("should parse `message` if passed as a function", function( done ) {
    var stubMessage = "foo";
    inquirer.ui.prompts.stub = function( params ) {
      this.opt = {
        when: function() { return true; }
      };
      expect(params.message).to.equal(stubMessage);
      done();
    };
    inquirer.ui.prompts.stub.prototype.run = function() {};

    var prompts = [{
      type: "input",
      name: "name1",
      message: "message",
      default: "bar"
    }, {
      type: "stub",
      name: "name",
      message: function( answers ) {
        expect(answers.name1).to.equal("bar");
        return stubMessage;
      }
    }];

    var ui = inquirer.prompt(prompts, function() {});
    ui.rl.emit("line");
  });

  it("should run asynchronous `message`", function( done ) {
    var stubMessage = "foo";
    inquirer.ui.prompts.stub = function( params ) {
      this.opt = {
        when: function() { return true; }
      };
      expect(params.message).to.equal(stubMessage);
      done();
    };
    inquirer.ui.prompts.stub.prototype.run = function() {};

    var prompts = [{
      type: "input",
      name: "name1",
      message: "message",
      default: "bar"
    }, {
      type: "stub",
      name: "name",
      message: function( answers ) {
        expect(answers.name1).to.equal("bar");
        var goOn = this.async();
        setTimeout(function() {
          goOn(stubMessage);
        }, 0 );
      }
    }];

    var ui = inquirer.prompt(prompts, function() {});
    ui.rl.emit("line");
  });

  it("should parse `default` if passed as a function", function( done ) {
    var stubDefault = "foo";
    inquirer.ui.prompts.stub = function( params ) {
      this.opt = {
        when: function() { return true; }
      };
      expect(params.default).to.equal(stubDefault);
      done();
    };
    inquirer.ui.prompts.stub.prototype.run = function() {};

    var prompts = [{
      type: "input",
      name: "name1",
      message: "message",
      default: "bar"
    }, {
      type: "stub",
      name: "name",
      message: "message",
      default: function( answers ) {
        expect(answers.name1).to.equal("bar");
        return stubDefault;
      }
    }];

    var ui = inquirer.prompt(prompts, function() {});
    ui.rl.emit("line");
  });

  it("should run asynchronous `default`", function( done ) {
    var goesInDefault = false;
    var input2Default = "foo";
    var prompts = [{
      type: "input",
      name: "name1",
      message: "message",
      default: "bar"
    }, {
      type: "input2",
      name: "q2",
      message: "message",
      default: function ( answers ) {
        goesInDefault = true;
        expect(answers.name1).to.equal("bar");
        var goOn = this.async();
        setTimeout(function() { goOn(input2Default); }, 0 );
        setTimeout(function() {
          ui.rl.emit("line");
        }, 10 );
      }
    }];

    var ui = inquirer.prompt( prompts, function( answers ) {
      expect(goesInDefault).to.be.true;
      expect(answers.q2).to.equal(input2Default);
      done();
    });

    ui.rl.emit("line");
  });

  it("should pass previous answers to the prompt constructor", function( done ) {
    inquirer.ui.prompts.stub = function( params, rl, answers ) {
      expect(answers.name1).to.equal("bar");
      done();
      return new inquirer.ui.prompts.input( params, rl, answers );
    };
    inquirer.ui.prompts.stub.prototype.run = function() {};

    var prompts = [{
      type: "input",
      name: "name1",
      message: "message",
      default: "bar"
    }, {
      type: "stub",
      name: "name",
      message: "message"
    }];

    var ui = inquirer.prompt(prompts, function() {});
    ui.rl.emit("line");
  });

  it("should parse `choices` if passed as a function", function( done ) {
    var stubChoices = [ "foo", "bar" ];
    inquirer.ui.prompts.stub = function( params ) {
      this.opt = {
        when: function() { return true; }
      };
      expect(params.choices).to.equal(stubChoices);
      done();
    };
    inquirer.ui.prompts.stub.prototype.run = function() {};

    var prompts = [{
      type: "input",
      name: "name1",
      message: "message",
      default: "bar"
    }, {
      type: "stub",
      name: "name",
      message: "message",
      choices: function( answers ) {
        expect(answers.name1).to.equal("bar");
        return stubChoices;
      }
    }];

    var ui = inquirer.prompt(prompts, function() {});
    ui.rl.emit("line");
  });

  it("should expose the Reactive interface", function(done) {
    var prompts = [{
      type: "input",
      name: "name1",
      message: "message",
      default: "bar"
    }, {
      type: "input",
      name: "name",
      message: "message",
      default: "doe"
    }];

    var ui = inquirer.prompt(prompts, function() {});
    var spy = sinon.spy();
    ui.process.subscribe( spy, function() {}, function() {
      sinon.assert.calledWith( spy, { name: "name1", answer: "bar" });
      sinon.assert.calledWith( spy, { name: "name", answer: "doe" });
      done();
    });
    ui.rl.emit("line");
    ui.rl.emit("line");
  });

  it("takes an Observable as question", function( done ) {
    var prompts = rx.Observable.create(function( obs ) {
      obs.onNext({
        type: "confirm",
        name: "q1",
        message: "message"
      });
      setTimeout(function() {
        obs.onNext({
          type: "confirm",
          name: "q2",
          message: "message",
          default: false
        });
        obs.onCompleted();
        ui.rl.emit("line");
      }, 30 );
    });

    var ui = inquirer.prompt( prompts, function( answers ) {
      expect(answers.q1).to.be.true;
      expect(answers.q2).to.be.false;
      done();
    });

    ui.rl.emit("line");
  });

  // Hierarchical prompts (`when`)
  describe("hierarchical mode", function() {

    it("should pass current answers to `when`", function( done ) {
      var prompts = [{
        type: "confirm",
        name: "q1",
        message: "message"
      }, {
        name: "q2",
        message: "message",
        when: function( answers ) {
          expect(answers).to.be.an("object");
          expect(answers.q1).to.be.true;
          done();
        }
      }];

      var ui = inquirer.prompt( prompts, function( answers ) {});

      ui.rl.emit("line");
    });

    it("should run prompt if `when` returns true", function( done ) {
      var goesInWhen = false;
      var prompts = [{
        type: "confirm",
        name: "q1",
        message: "message"
      }, {
        type: "input",
        name: "q2",
        message: "message",
        default: "bar-var",
        when: function() {
          goesInWhen = true;
          return true;
        }
      }];

      var ui = inquirer.prompt( prompts, function( answers ) {
        expect(goesInWhen).to.be.true;
        expect(answers.q2).to.equal("bar-var");
        done();
      });

      ui.rl.emit("line");
      ui.rl.emit("line");
    });

    it("should not run prompt if `when` returns false", function( done ) {
      var goesInWhen = false;
      var prompts = [{
        type: "confirm",
        name: "q1",
        message: "message"
      }, {
        type: "confirm",
        name: "q2",
        message: "message",
        when: function() {
          goesInWhen = true;
          return false;
        }
      }, {
        type: "input",
        name: "q3",
        message: "message",
        default: "foo"
      }];

      var ui = inquirer.prompt( prompts, function( answers ) {
        expect(goesInWhen).to.be.true;
        expect(answers.q2).to.not.exist;
        expect(answers.q3).to.equal("foo");
        expect(answers.q1).to.be.true;
        done();
      });

      ui.rl.emit("line");
      ui.rl.emit("line");

    });

    it("should run asynchronous `when`", function( done ) {
      var goesInWhen = false;
      var prompts = [{
        type: "confirm",
        name: "q1",
        message: "message"
      }, {
        type: "input",
        name: "q2",
        message: "message",
        default: "foo-bar",
        when: function() {
          goesInWhen = true;
          var goOn = this.async();
          setTimeout(function() { goOn(true); }, 0 );
          setTimeout(function() {
            ui.rl.emit("line");
          }, 10 );
        }
      }];

      var ui = inquirer.prompt( prompts, function( answers ) {
        expect(goesInWhen).to.be.true;
        expect(answers.q2).to.equal("foo-bar");
        done();
      });

      ui.rl.emit("line");
    });

  });

  describe("#registerPrompt()", function() {
    it("register new prompt types", function( done ) {
      var questions = [{ type: "foo", message: "something" }];
      inquirer.registerPrompt("foo", function( question, rl, answers ) {
        expect(question).to.eql(questions[0]);
        expect(answers).to.eql({});
        this.run = _.noop;
        done();
      });

      inquirer.prompt(questions, _.noop);
    });

    it("overwrite default prompt types", function( done ) {
      var questions = [{ type: "confirm", message: "something" }];
      inquirer.registerPrompt("confirm", function( question, rl, answers ) {
        this.run = _.noop;
        done();
      });

      inquirer.prompt(questions, _.noop);
      inquirer.restoreDefaultPrompts();
    });
  });

  describe("#restoreDefaultPrompts()", function() {
    it("restore default prompts", function() {
      var ConfirmPrompt = inquirer.ui.prompts["confirm"];
      inquirer.registerPrompt("confirm", _.noop);
      inquirer.restoreDefaultPrompts();
      expect(ConfirmPrompt).to.equal(inquirer.ui.prompts["confirm"]);
    });
  });

});
