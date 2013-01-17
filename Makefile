
build: components src/Stream.js
	@component build --dev
	@component build --standalone Stream -o lib -n Stream

components: component.json
	@component install --dev

clean:
	rm -fr build components template.js lib/*

.PHONY: clean
