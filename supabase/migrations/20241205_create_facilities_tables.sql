-- SF7: School Building and Facilities Inventory
-- Migration: Create facilities and rooms tables
-- Created: December 5, 2025

-- =====================================================
-- TABLE: facilities
-- Tracks school buildings, rooms, and facilities
-- =====================================================
CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id VARCHAR(255) NOT NULL,
  
  -- Basic Information
  name VARCHAR(255) NOT NULL,
  facility_type VARCHAR(50) NOT NULL, -- 'building', 'classroom', 'laboratory', 'library', 'office', 'sports', 'restroom', 'cafeteria', 'auditorium', 'other'
  building_name VARCHAR(255), -- Parent building if this is a room
  floor_number INTEGER,
  room_number VARCHAR(50),
  
  -- Capacity & Dimensions
  capacity INTEGER, -- Maximum occupancy
  area_sqm DECIMAL(10, 2), -- Area in square meters
  
  -- Condition & Status
  condition VARCHAR(50) NOT NULL DEFAULT 'good', -- 'excellent', 'good', 'fair', 'poor', 'needs_repair', 'condemned'
  status VARCHAR(50) NOT NULL DEFAULT 'operational', -- 'operational', 'under_repair', 'under_construction', 'closed', 'demolished'
  
  -- Equipment & Amenities (JSON arrays)
  equipment JSONB DEFAULT '[]'::jsonb, -- List of equipment/furniture
  amenities JSONB DEFAULT '[]'::jsonb, -- AC, projector, wifi, etc.
  
  -- Usage & Assignment
  primary_use VARCHAR(100), -- Science Lab, Math Class, etc.
  assigned_to VARCHAR(255), -- Teacher ID or department
  
  -- Maintenance & Inspection
  last_inspection_date DATE,
  next_inspection_date DATE,
  last_maintenance_date DATE,
  maintenance_notes TEXT,
  
  -- Construction Details
  year_constructed INTEGER,
  year_renovated INTEGER,
  construction_type VARCHAR(100), -- 'concrete', 'wood', 'mixed', etc.
  
  -- Safety & Compliance
  fire_exit_access BOOLEAN DEFAULT false,
  accessibility_features JSONB DEFAULT '[]'::jsonb, -- ramp, elevator, etc.
  safety_hazards TEXT,
  
  -- Financial
  acquisition_cost DECIMAL(12, 2),
  estimated_value DECIMAL(12, 2),
  
  -- Additional Info
  remarks TEXT,
  photos JSONB DEFAULT '[]'::jsonb, -- Array of photo URLs
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- TABLE: facility_maintenance_logs
-- Tracks maintenance and repair history
-- =====================================================
CREATE TABLE IF NOT EXISTS facility_maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  school_id VARCHAR(255) NOT NULL,
  
  -- Maintenance Details
  maintenance_type VARCHAR(50) NOT NULL, -- 'routine', 'repair', 'emergency', 'inspection', 'renovation'
  description TEXT NOT NULL,
  issue_reported TEXT,
  
  -- Dates
  reported_date DATE NOT NULL,
  scheduled_date DATE,
  completed_date DATE,
  
  -- Cost & Personnel
  cost DECIMAL(12, 2),
  vendor VARCHAR(255),
  performed_by VARCHAR(255), -- Staff/contractor name
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  priority VARCHAR(50) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Attachments
  photos JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  
  remarks TEXT,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- INDEXES for performance
-- =====================================================

-- Facilities indexes
CREATE INDEX idx_facilities_school_id ON facilities(school_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_facilities_type ON facilities(facility_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_facilities_status ON facilities(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_facilities_condition ON facilities(condition) WHERE deleted_at IS NULL;
CREATE INDEX idx_facilities_building ON facilities(building_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_facilities_assigned ON facilities(assigned_to) WHERE deleted_at IS NULL;

-- Composite indexes for common queries
CREATE INDEX idx_facilities_school_type ON facilities(school_id, facility_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_facilities_school_status ON facilities(school_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_facilities_school_condition ON facilities(school_id, condition) WHERE deleted_at IS NULL;

-- Maintenance logs indexes
CREATE INDEX idx_maintenance_facility ON facility_maintenance_logs(facility_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenance_school ON facility_maintenance_logs(school_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenance_status ON facility_maintenance_logs(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenance_dates ON facility_maintenance_logs(reported_date, completed_date) WHERE deleted_at IS NULL;

-- =====================================================
-- CONSTRAINTS
-- =====================================================

ALTER TABLE facilities 
  ADD CONSTRAINT check_facility_type 
  CHECK (facility_type IN ('building', 'classroom', 'laboratory', 'library', 'office', 'sports', 'restroom', 'cafeteria', 'auditorium', 'other'));

ALTER TABLE facilities 
  ADD CONSTRAINT check_condition 
  CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'needs_repair', 'condemned'));

ALTER TABLE facilities 
  ADD CONSTRAINT check_status 
  CHECK (status IN ('operational', 'under_repair', 'under_construction', 'closed', 'demolished'));

ALTER TABLE facilities 
  ADD CONSTRAINT check_capacity_positive 
  CHECK (capacity IS NULL OR capacity > 0);

ALTER TABLE facilities 
  ADD CONSTRAINT check_area_positive 
  CHECK (area_sqm IS NULL OR area_sqm > 0);

ALTER TABLE facility_maintenance_logs 
  ADD CONSTRAINT check_maintenance_type 
  CHECK (maintenance_type IN ('routine', 'repair', 'emergency', 'inspection', 'renovation'));

ALTER TABLE facility_maintenance_logs 
  ADD CONSTRAINT check_maintenance_status 
  CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));

ALTER TABLE facility_maintenance_logs 
  ADD CONSTRAINT check_priority 
  CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- =====================================================
-- TRIGGERS for updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_facilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER facilities_updated_at
  BEFORE UPDATE ON facilities
  FOR EACH ROW
  EXECUTE FUNCTION update_facilities_updated_at();

CREATE TRIGGER maintenance_logs_updated_at
  BEFORE UPDATE ON facility_maintenance_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_facilities_updated_at();

-- =====================================================
-- COMMENTS for documentation
-- =====================================================

COMMENT ON TABLE facilities IS 'SF7: School buildings, rooms, and facilities inventory';
COMMENT ON TABLE facility_maintenance_logs IS 'SF7: Maintenance and repair history for facilities';

COMMENT ON COLUMN facilities.facility_type IS 'Type of facility: building, classroom, laboratory, library, office, sports, restroom, cafeteria, auditorium, other';
COMMENT ON COLUMN facilities.condition IS 'Physical condition: excellent, good, fair, poor, needs_repair, condemned';
COMMENT ON COLUMN facilities.status IS 'Operational status: operational, under_repair, under_construction, closed, demolished';
COMMENT ON COLUMN facilities.equipment IS 'JSON array of equipment/furniture items';
COMMENT ON COLUMN facilities.amenities IS 'JSON array of amenities (AC, projector, wifi, etc.)';
COMMENT ON COLUMN facilities.accessibility_features IS 'JSON array of accessibility features (ramp, elevator, etc.)';

COMMENT ON COLUMN facility_maintenance_logs.maintenance_type IS 'Type: routine, repair, emergency, inspection, renovation';
COMMENT ON COLUMN facility_maintenance_logs.status IS 'Status: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN facility_maintenance_logs.priority IS 'Priority: low, normal, high, urgent';
