from http.server import SimpleHTTPRequestHandler, HTTPServer
import os

class CustomHandler(SimpleHTTPRequestHandler):
	def do_GET(self):
		# Check if the root path is requested
		if self.path == "/":
			self.path = "/index.html"
		
		# Translate the requested path into the file system path
		file_path = self.translate_path(self.path)

		# Serve the file if it exists
		if os.path.exists(file_path) and not os.path.isdir(file_path):
			return super().do_GET()
		else:
			# Serve 404.html for unmatched routes
			self.send_response(404)
			self.send_header("Content-type", "text/html")
			self.end_headers()
			try:
				with open("404.html", "rb") as f:
					self.wfile.write(f.read())
			except FileNotFoundError:
				self.wfile.write(b"404 - Page Not Found")

if __name__ == "__main__":
	port = 8000
	server = HTTPServer(("0.0.0.0", port), CustomHandler)
	print(f"Serving on port {port}")
	server.serve_forever()