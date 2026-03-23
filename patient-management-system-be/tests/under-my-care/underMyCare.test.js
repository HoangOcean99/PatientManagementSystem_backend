import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    addDependent,
    getDependents,
    getDependentDetail,
    updateDependent,
    removeDependent,
    generateShareCode,
    linkDependent,
} from "../../controllers/underMyCareController.js";
import * as underMyCareService from "../../services/underMyCareService.js";
import { AppError } from "../../utils/app-error.js";

vi.mock("../../services/underMyCareService.js", () => ({
    addDependent: vi.fn(),
    getDependents: vi.fn(),
    getDependentDetail: vi.fn(),
    updateDependent: vi.fn(),
    removeDependent: vi.fn(),
    generateShareCode: vi.fn(),
    linkByShareCode: vi.fn(),
}));

describe("UnderMyCare Controller", () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: { id: "parent-001" },
            params: {},
            query: {},
            body: {},
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        next = vi.fn();
        vi.clearAllMocks();
    });

    // ── addDependent ──
    describe("addDependent", () => {
        it("should create dependent and return 201", async () => {
            req.body = { full_name: "Child A", dob: "2020-01-01", address: "123 St" };
            const mockData = { relationship_id: "rel-1", child_user_id: "child-001" };
            underMyCareService.addDependent.mockResolvedValue(mockData);

            await addDependent(req, res, next);

            expect(underMyCareService.addDependent).toHaveBeenCalledWith("parent-001", req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                status: "success",
                message: "Dependent added successfully",
                data: mockData,
            });
        });

        it("should throw 400 if full_name missing", async () => {
            req.body = { dob: "2020-01-01", address: "123 St" };

            await addDependent(req, res, next);
            await new Promise((r) => setTimeout(r, 0));

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(400);
        });
    });

    // ── getDependents ──
    describe("getDependents", () => {
        it("should return list of dependents", async () => {
            const mockData = [{ relationship_id: "rel-1" }];
            underMyCareService.getDependents.mockResolvedValue(mockData);

            await getDependents(req, res, next);

            expect(underMyCareService.getDependents).toHaveBeenCalledWith("parent-001");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ status: "success", data: mockData });
        });
    });

    // ── getDependentDetail ──
    describe("getDependentDetail", () => {
        it("should return single dependent detail", async () => {
            req.params.relationshipId = "rel-1";
            const mockData = { relationship_id: "rel-1", child_user_id: "child-001" };
            underMyCareService.getDependentDetail.mockResolvedValue(mockData);

            await getDependentDetail(req, res, next);

            expect(underMyCareService.getDependentDetail).toHaveBeenCalledWith("parent-001", "rel-1");
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // ── updateDependent ──
    describe("updateDependent", () => {
        it("should update dependent and return 200", async () => {
            req.params.relationshipId = "rel-1";
            req.body = { full_name: "Updated Name" };
            const mockData = { relationship_id: "rel-1" };
            underMyCareService.updateDependent.mockResolvedValue(mockData);

            await updateDependent(req, res, next);

            expect(underMyCareService.updateDependent).toHaveBeenCalledWith("parent-001", "rel-1", req.body);
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // ── removeDependent ──
    describe("removeDependent", () => {
        it("should remove dependent link and return 200", async () => {
            req.params.relationshipId = "rel-1";
            underMyCareService.removeDependent.mockResolvedValue({ success: true });

            await removeDependent(req, res, next);

            expect(underMyCareService.removeDependent).toHaveBeenCalledWith("parent-001", "rel-1");
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // ── generateShareCode ──
    describe("generateShareCode", () => {
        it("should generate share code and return 201", async () => {
            req.body = { child_user_id: "child-001" };
            const mockData = { share_code: "A3F1B2", expires_in_minutes: 15 };
            underMyCareService.generateShareCode.mockResolvedValue(mockData);

            await generateShareCode(req, res, next);

            expect(underMyCareService.generateShareCode).toHaveBeenCalledWith("parent-001", "child-001");
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it("should throw 400 if child_user_id missing", async () => {
            req.body = {};

            await generateShareCode(req, res, next);
            await new Promise((r) => setTimeout(r, 0));

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(400);
        });
    });

    // ── linkDependent ──
    describe("linkDependent", () => {
        it("should link dependent by share code and return 201", async () => {
            req.body = { share_code: "A3F1B2", relationship: "guardian" };
            const mockData = { relationship_id: "rel-2", child_user_id: "child-001" };
            underMyCareService.linkByShareCode.mockResolvedValue(mockData);

            await linkDependent(req, res, next);

            expect(underMyCareService.linkByShareCode).toHaveBeenCalledWith("parent-001", "A3F1B2", "guardian");
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it("should throw 400 if share_code missing", async () => {
            req.body = {};

            await linkDependent(req, res, next);
            await new Promise((r) => setTimeout(r, 0));

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(400);
        });
    });
});
