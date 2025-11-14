// vite.config.ts
import { sentryVitePlugin } from "file:///var/tmp/automagik-forge-dev/worktrees/b380-remove-preview-b/node_modules/.pnpm/@sentry+vite-plugin@4.6.0/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
import { defineConfig } from "file:///var/tmp/automagik-forge-dev/worktrees/b380-remove-preview-b/node_modules/.pnpm/vite@5.4.21_@types+node@24.10.0_terser@5.44.1/node_modules/vite/dist/node/index.js";
import react from "file:///var/tmp/automagik-forge-dev/worktrees/b380-remove-preview-b/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@24.10.0_terser@5.44.1_/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import fs from "fs";
var __vite_injected_original_dirname = "/var/tmp/automagik-forge-dev/worktrees/b380-remove-preview-b/frontend";
function executorSchemasPlugin() {
  const VIRTUAL_ID = "virtual:executor-schemas";
  const RESOLVED_VIRTUAL_ID = "\0" + VIRTUAL_ID;
  return {
    name: "executor-schemas-plugin",
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
      return null;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return null;
      const schemasDir = path.resolve(__vite_injected_original_dirname, "../shared/schemas");
      const files = fs.existsSync(schemasDir) ? fs.readdirSync(schemasDir).filter((f) => f.endsWith(".json")) : [];
      const imports = [];
      const entries = [];
      files.forEach((file, i) => {
        const varName = `__schema_${i}`;
        const importPath = `shared/schemas/${file}`;
        const key = file.replace(/\.json$/, "").toUpperCase();
        imports.push(`import ${varName} from "${importPath}";`);
        entries.push(`  "${key}": ${varName}`);
      });
      const code = `
${imports.join("\n")}

export const schemas = {
${entries.join(",\n")}
};

export default schemas;
`;
      return code;
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "namastex-labs",
      project: "automagik-forge",
      telemetry: false
    }),
    executorSchemasPlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      shared: path.resolve(__vite_injected_original_dirname, "../shared")
    }
  },
  server: {
    host: process.env.HOST || "127.0.0.1",
    port: parseInt(process.env.FRONTEND_PORT || "3000"),
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.BACKEND_PORT || "8887"}`,
        changeOrigin: true,
        ws: true
      },
      "/health": {
        target: `http://localhost:${process.env.BACKEND_PORT || "8887"}`,
        changeOrigin: true
      }
    },
    fs: {
      allow: [path.resolve(__vite_injected_original_dirname, "."), path.resolve(__vite_injected_original_dirname, "..")]
    },
    open: process.env.VITE_OPEN === "true"
  },
  build: { sourcemap: true }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvdmFyL3RtcC9hdXRvbWFnaWstZm9yZ2UtZGV2L3dvcmt0cmVlcy9iMzgwLXJlbW92ZS1wcmV2aWV3LWIvZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi92YXIvdG1wL2F1dG9tYWdpay1mb3JnZS1kZXYvd29ya3RyZWVzL2IzODAtcmVtb3ZlLXByZXZpZXctYi9mcm9udGVuZC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vdmFyL3RtcC9hdXRvbWFnaWstZm9yZ2UtZGV2L3dvcmt0cmVlcy9iMzgwLXJlbW92ZS1wcmV2aWV3LWIvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjsvLyB2aXRlLmNvbmZpZy50c1xuaW1wb3J0IHsgc2VudHJ5Vml0ZVBsdWdpbiB9IGZyb20gXCJAc2VudHJ5L3ZpdGUtcGx1Z2luXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIFBsdWdpbiB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xuXG5mdW5jdGlvbiBleGVjdXRvclNjaGVtYXNQbHVnaW4oKTogUGx1Z2luIHtcbiAgY29uc3QgVklSVFVBTF9JRCA9IFwidmlydHVhbDpleGVjdXRvci1zY2hlbWFzXCI7XG4gIGNvbnN0IFJFU09MVkVEX1ZJUlRVQUxfSUQgPSBcIlxcMFwiICsgVklSVFVBTF9JRDtcblxuICByZXR1cm4ge1xuICAgIG5hbWU6IFwiZXhlY3V0b3Itc2NoZW1hcy1wbHVnaW5cIixcbiAgICByZXNvbHZlSWQoaWQpIHtcbiAgICAgIGlmIChpZCA9PT0gVklSVFVBTF9JRCkgcmV0dXJuIFJFU09MVkVEX1ZJUlRVQUxfSUQ7IC8vIGtlZXAgaXQgdmlydHVhbFxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcbiAgICBsb2FkKGlkKSB7XG4gICAgICBpZiAoaWQgIT09IFJFU09MVkVEX1ZJUlRVQUxfSUQpIHJldHVybiBudWxsO1xuXG4gICAgICBjb25zdCBzY2hlbWFzRGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLi9zaGFyZWQvc2NoZW1hc1wiKTtcbiAgICAgIGNvbnN0IGZpbGVzID0gZnMuZXhpc3RzU3luYyhzY2hlbWFzRGlyKVxuICAgICAgICA/IGZzLnJlYWRkaXJTeW5jKHNjaGVtYXNEaXIpLmZpbHRlcigoZikgPT4gZi5lbmRzV2l0aChcIi5qc29uXCIpKVxuICAgICAgICA6IFtdO1xuXG4gICAgICBjb25zdCBpbXBvcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgY29uc3QgZW50cmllczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgZmlsZXMuZm9yRWFjaCgoZmlsZSwgaSkgPT4ge1xuICAgICAgICBjb25zdCB2YXJOYW1lID0gYF9fc2NoZW1hXyR7aX1gO1xuICAgICAgICBjb25zdCBpbXBvcnRQYXRoID0gYHNoYXJlZC9zY2hlbWFzLyR7ZmlsZX1gOyAvLyB1c2VzIHlvdXIgYWxpYXNcbiAgICAgICAgY29uc3Qga2V5ID0gZmlsZS5yZXBsYWNlKC9cXC5qc29uJC8sIFwiXCIpLnRvVXBwZXJDYXNlKCk7IC8vIGNsYXVkZV9jb2RlIC0+IENMQVVERV9DT0RFXG4gICAgICAgIGltcG9ydHMucHVzaChgaW1wb3J0ICR7dmFyTmFtZX0gZnJvbSBcIiR7aW1wb3J0UGF0aH1cIjtgKTtcbiAgICAgICAgZW50cmllcy5wdXNoKGAgIFwiJHtrZXl9XCI6ICR7dmFyTmFtZX1gKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBJTVBPUlRBTlQ6IHB1cmUgSlMgKG5vIFRTIHR5cGVzKSwgYW5kIHF1b3RlIGtleXMuXG4gICAgICBjb25zdCBjb2RlID0gYFxuJHtpbXBvcnRzLmpvaW4oXCJcXG5cIil9XG5cbmV4cG9ydCBjb25zdCBzY2hlbWFzID0ge1xuJHtlbnRyaWVzLmpvaW4oXCIsXFxuXCIpfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgc2NoZW1hcztcbmA7XG4gICAgICByZXR1cm4gY29kZTtcbiAgICB9LFxuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBzZW50cnlWaXRlUGx1Z2luKHtcbiAgICAgIG9yZzogXCJuYW1hc3RleC1sYWJzXCIsXG4gICAgICBwcm9qZWN0OiBcImF1dG9tYWdpay1mb3JnZVwiLFxuICAgICAgdGVsZW1ldHJ5OiBmYWxzZSxcbiAgICB9KSxcbiAgICBleGVjdXRvclNjaGVtYXNQbHVnaW4oKSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgIHNoYXJlZDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLi9zaGFyZWRcIiksXG4gICAgfSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogcHJvY2Vzcy5lbnYuSE9TVCB8fCBcIjEyNy4wLjAuMVwiLFxuICAgIHBvcnQ6IHBhcnNlSW50KHByb2Nlc3MuZW52LkZST05URU5EX1BPUlQgfHwgXCIzMDAwXCIpLFxuICAgIHByb3h5OiB7XG4gICAgICBcIi9hcGlcIjoge1xuICAgICAgICB0YXJnZXQ6IGBodHRwOi8vbG9jYWxob3N0OiR7cHJvY2Vzcy5lbnYuQkFDS0VORF9QT1JUIHx8IFwiODg4N1wifWAsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgd3M6IHRydWUsXG4gICAgICB9LFxuICAgICAgXCIvaGVhbHRoXCI6IHtcbiAgICAgICAgdGFyZ2V0OiBgaHR0cDovL2xvY2FsaG9zdDoke3Byb2Nlc3MuZW52LkJBQ0tFTkRfUE9SVCB8fCBcIjg4ODdcIn1gLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICB9LFxuICAgIH0sXG4gICAgZnM6IHtcbiAgICAgIGFsbG93OiBbcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuXCIpLCBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4uXCIpXSxcbiAgICB9LFxuICAgIG9wZW46IHByb2Nlc3MuZW52LlZJVEVfT1BFTiA9PT0gXCJ0cnVlXCIsXG4gIH0sXG4gIGJ1aWxkOiB7IHNvdXJjZW1hcDogdHJ1ZSB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyx3QkFBd0I7QUFDakMsU0FBUyxvQkFBNEI7QUFDckMsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFFBQVE7QUFMZixJQUFNLG1DQUFtQztBQU96QyxTQUFTLHdCQUFnQztBQUN2QyxRQUFNLGFBQWE7QUFDbkIsUUFBTSxzQkFBc0IsT0FBTztBQUVuQyxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixVQUFVLElBQUk7QUFDWixVQUFJLE9BQU8sV0FBWSxRQUFPO0FBQzlCLGFBQU87QUFBQSxJQUNUO0FBQUEsSUFDQSxLQUFLLElBQUk7QUFDUCxVQUFJLE9BQU8sb0JBQXFCLFFBQU87QUFFdkMsWUFBTSxhQUFhLEtBQUssUUFBUSxrQ0FBVyxtQkFBbUI7QUFDOUQsWUFBTSxRQUFRLEdBQUcsV0FBVyxVQUFVLElBQ2xDLEdBQUcsWUFBWSxVQUFVLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxTQUFTLE9BQU8sQ0FBQyxJQUM1RCxDQUFDO0FBRUwsWUFBTSxVQUFvQixDQUFDO0FBQzNCLFlBQU0sVUFBb0IsQ0FBQztBQUUzQixZQUFNLFFBQVEsQ0FBQyxNQUFNLE1BQU07QUFDekIsY0FBTSxVQUFVLFlBQVksQ0FBQztBQUM3QixjQUFNLGFBQWEsa0JBQWtCLElBQUk7QUFDekMsY0FBTSxNQUFNLEtBQUssUUFBUSxXQUFXLEVBQUUsRUFBRSxZQUFZO0FBQ3BELGdCQUFRLEtBQUssVUFBVSxPQUFPLFVBQVUsVUFBVSxJQUFJO0FBQ3RELGdCQUFRLEtBQUssTUFBTSxHQUFHLE1BQU0sT0FBTyxFQUFFO0FBQUEsTUFDdkMsQ0FBQztBQUdELFlBQU0sT0FBTztBQUFBLEVBQ2pCLFFBQVEsS0FBSyxJQUFJLENBQUM7QUFBQTtBQUFBO0FBQUEsRUFHbEIsUUFBUSxLQUFLLEtBQUssQ0FBQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBS2YsYUFBTztBQUFBLElBQ1Q7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixpQkFBaUI7QUFBQSxNQUNmLEtBQUs7QUFBQSxNQUNMLFNBQVM7QUFBQSxNQUNULFdBQVc7QUFBQSxJQUNiLENBQUM7QUFBQSxJQUNELHNCQUFzQjtBQUFBLEVBQ3hCO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDcEMsUUFBUSxLQUFLLFFBQVEsa0NBQVcsV0FBVztBQUFBLElBQzdDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTSxRQUFRLElBQUksUUFBUTtBQUFBLElBQzFCLE1BQU0sU0FBUyxRQUFRLElBQUksaUJBQWlCLE1BQU07QUFBQSxJQUNsRCxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRLG9CQUFvQixRQUFRLElBQUksZ0JBQWdCLE1BQU07QUFBQSxRQUM5RCxjQUFjO0FBQUEsUUFDZCxJQUFJO0FBQUEsTUFDTjtBQUFBLE1BQ0EsV0FBVztBQUFBLFFBQ1QsUUFBUSxvQkFBb0IsUUFBUSxJQUFJLGdCQUFnQixNQUFNO0FBQUEsUUFDOUQsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLElBQ0EsSUFBSTtBQUFBLE1BQ0YsT0FBTyxDQUFDLEtBQUssUUFBUSxrQ0FBVyxHQUFHLEdBQUcsS0FBSyxRQUFRLGtDQUFXLElBQUksQ0FBQztBQUFBLElBQ3JFO0FBQUEsSUFDQSxNQUFNLFFBQVEsSUFBSSxjQUFjO0FBQUEsRUFDbEM7QUFBQSxFQUNBLE9BQU8sRUFBRSxXQUFXLEtBQUs7QUFDM0IsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
